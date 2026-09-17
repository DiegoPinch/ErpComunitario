const pool = require('../config/db');
const { lockFinancialLedger, assertAccountingDateOpen } = require('../utils/periodLock');
const { money } = require('../utils/accountingRules');

async function save(req,res,next) {
    let db;
    try {
        const {date, counted, reason} = req.body;
        const today=new Date();
        const todayKey=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const parsedDate = new Date(date+'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
            date>todayKey ||
            !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0,10)!==date ||
            counted===null || counted===undefined || counted==='' || Number(counted)<0 || !String(reason || '').trim()) {
            throw Object.assign(new Error('Ingrese fecha válida, efectivo contado y observación'),{status:400});
        }
        const physical = money(counted);
        db=await pool.getConnection();
        await db.beginTransaction();
        await lockFinancialLedger(db);
        await assertAccountingDateOpen(db,date);
        const start=date+' 00:00:00';
        const end=date+' 23:59:59';
        const [[row]]=await db.query(`SELECT
          COALESCE((SELECT SUM(invoice_amount) FROM payments WHERE status='posted' AND payment_method='cash' AND payment_date BETWEEN ? AND ?),0)
          +COALESCE((SELECT SUM(amount_paid) FROM debt_payments WHERE status='posted' AND payment_method='cash' AND payment_date BETWEEN ? AND ?),0)
          +COALESCE((SELECT SUM(amount) FROM other_incomes WHERE status='posted' AND payment_method='cash' AND income_date BETWEEN ? AND ?),0)
          -COALESCE((SELECT SUM(amount) FROM expenses WHERE status='posted' AND payment_method='cash' AND expense_date BETWEEN ? AND ?),0) AS expected`,
          [start,end,start,end,start,end,start,end]);
        const snapshot={version:2,date,scope:'daily_cash_movement',expected:money(row.expected),counted:physical,difference:money(physical-Number(row.expected))};
        const [result]=await db.query(`INSERT INTO financial_audit_log
          (system_user_id,action,entity_type,entity_id,reason,after_json)
          VALUES (?,'record','cash_count',?,?,?)`,[req.user.id,Number(date.replace(/-/g,'')),String(reason).trim().slice(0,255),JSON.stringify(snapshot)]);
        await db.commit();
        res.status(201).json({...snapshot,audit_id:result.insertId});
    } catch(error) {if(db)await db.rollback();next(error);} finally {if(db)db.release();}
}

async function listCollectionDays(req,res,next) {
    try {
        const year = Number(req.query.year);
        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            throw Object.assign(new Error('Año no válido'), {status:400});
        }
        const start = `${year}-01-01 00:00:00`;
        const end = `${year}-12-31 23:59:59`;
        const [days] = await pool.query(`
          SELECT x.collection_date,
            COUNT(*) AS movement_count,
            ROUND(SUM(x.cash_income),2) AS cash_income,
            ROUND(SUM(x.bank_income),2) AS bank_income,
            ROUND(COALESCE(e.cash_out,0),2) AS cash_out,
            ROUND(SUM(x.cash_income)-COALESCE(e.cash_out,0),2) AS expected_cash
          FROM (
            SELECT DATE_FORMAT(payment_date,'%Y-%m-%d') AS collection_date,
              CASE WHEN payment_method='cash' THEN invoice_amount ELSE 0 END AS cash_income,
              CASE WHEN payment_method<>'cash' THEN invoice_amount ELSE 0 END AS bank_income
            FROM payments WHERE status='posted' AND payment_date BETWEEN ? AND ?
            UNION ALL
            SELECT DATE_FORMAT(payment_date,'%Y-%m-%d'),
              CASE WHEN payment_method='cash' THEN amount_paid ELSE 0 END,
              CASE WHEN payment_method<>'cash' THEN amount_paid ELSE 0 END
            FROM debt_payments WHERE status='posted' AND payment_date BETWEEN ? AND ?
            UNION ALL
            SELECT DATE_FORMAT(income_date,'%Y-%m-%d'),
              CASE WHEN payment_method='cash' THEN amount ELSE 0 END,
              CASE WHEN payment_method<>'cash' THEN amount ELSE 0 END
            FROM other_incomes WHERE status='posted' AND income_date BETWEEN ? AND ?
          ) x
          LEFT JOIN (
            SELECT DATE_FORMAT(expense_date,'%Y-%m-%d') AS expense_date, SUM(amount) AS cash_out
            FROM expenses
            WHERE status='posted' AND payment_method='cash' AND expense_date BETWEEN ? AND ?
            GROUP BY DATE_FORMAT(expense_date,'%Y-%m-%d')
          ) e ON e.expense_date=x.collection_date
          GROUP BY x.collection_date,e.cash_out
          ORDER BY x.collection_date DESC`, [start,end,start,end,start,end,start,end]);

        const [audits] = await pool.query(`
          SELECT a.entity_id,a.after_json,a.reason,a.occurred_at,su.username
          FROM financial_audit_log a
          JOIN system_users su ON su.system_user_id=a.system_user_id
          WHERE a.entity_type='cash_count' AND a.entity_id BETWEEN ? AND ?
          ORDER BY a.audit_id DESC`, [Number(`${year}0101`),Number(`${year}1231`)]);
        const latest = new Map();
        for (const audit of audits) {
            if (latest.has(Number(audit.entity_id))) continue;
            let values = {};
            try {
                values = typeof audit.after_json==='string' ? JSON.parse(audit.after_json) : (audit.after_json || {});
            } catch (_) {
                // Un registro histórico mal formado no debe impedir consultar las demás jornadas.
            }
            latest.set(Number(audit.entity_id), {...values,reason:audit.reason,recorded_at:audit.occurred_at,username:audit.username});
        }
        const knownDates = new Set(days.map(day => day.collection_date));
        for (const [entityId] of latest) {
            const raw = String(entityId);
            if (!/^\d{8}$/.test(raw)) continue;
            const date = `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
            if (!knownDates.has(date)) {
                days.push({collection_date:date,movement_count:0,cash_income:0,bank_income:0,cash_out:0,expected_cash:0});
            }
        }
        days.sort((a,b) => String(b.collection_date).localeCompare(String(a.collection_date)));
        res.json(days.map(day => {
            const audit = latest.get(Number(day.collection_date.replace(/-/g,'')));
            const countStatus = !audit ? 'pending'
                : audit.scope==='daily_cash_movement' && Math.abs(Number(audit.expected)-Number(day.expected_cash))<=0.005
                    ? 'saved' : 'update_required';
            return {...day,total_income:Number(day.cash_income)+Number(day.bank_income),
                has_count:Boolean(audit),counted:audit?.counted ?? null,difference:audit?.difference ?? null,
                count_status:countStatus,
                count_scope:audit?.scope ?? null,reason:audit?.reason ?? null,recorded_at:audit?.recorded_at ?? null,
                username:audit?.username ?? null};
        }));
    } catch(error) {next(error);}
}

module.exports={save,listCollectionDays};
