export interface ConditionModel{
    // Значение поля
    field: any;
    // Операция
    operation: string;
    // Значение для операции
    value: any;
    // Нужно для dateBetween
    value2: any;
}

export interface ConditionGroupModel{
    // Условие
    conditions: ConditionModel[];
    // Объединение условий
    combineConditions: string[];
}