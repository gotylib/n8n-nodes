// Одно условие (внутри блока)
export interface ConditionModel {
    // Номер поля
    fieldNumber: number;
    // Операция (equal, notEqual, contains)
    operation: string;
    // Значение для сравнения
    value: string;
    // Значение для DateBetween
    value2: Date;
    // Объединение с следующим условием
    combineNext: 'and' | 'or';
}


// Один блок (регистр + его условия)
export interface BlockModel {
    // Номер регистра
    registerNumber: number;
    // Условия для этого регистра
    conditions?: ConditionModel[]
}

// Обёртка блоков из fixedCollection
export interface BlocksWrapper {
    block?: BlockModel[];
}

// То что приходит из getNodeParameter('blocks', i)
export type BlocksParameter = BlocksWrapper;
