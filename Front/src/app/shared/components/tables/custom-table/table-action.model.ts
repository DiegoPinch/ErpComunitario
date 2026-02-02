export interface TableAction {
    label?: string;
    icon?: string;
    styleClass?: string; // 'p-button-danger', 'p-button-success', etc.
    tooltip?: string;
    command: (row: any) => void;
}
