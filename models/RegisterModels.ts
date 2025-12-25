export interface RegisterModel{
    header: string[];
    table: any[][];
}

export interface ComplectRegisterModel {
    registers: { [key: string]: RegisterModel }; 
}
