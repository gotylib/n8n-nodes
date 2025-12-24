import { ConditionModel, ConditionGroupModel } from "../models/ConditionModels";


export const performConditionGroup = (conditionGroup: ConditionGroupModel): boolean => {
    if(conditionGroup.conditions.length === 0){
        return true;
    }

   if(conditionGroup.combineConditions.length === 0){
        throw new Error('Combine conditions is required');
    }
   
   const result = conditionGroup.conditions.map((condition) => performCondition(condition));

   if(conditionGroup.combineConditions.includes('and') && result.some((r) => r === false)){
    return false;
   }

   if(conditionGroup.combineConditions.includes('or') && result.some((r) => r === true)){
    return true;
   }

   for(let i = 0; i < conditionGroup.combineConditions.length; i++){

   }
   
}



// Функция для выполнения условия
export const performCondition = (condition: ConditionModel): boolean => {
    switch (condition.operation) {
        case 'equal':
            return String(condition.field) === String(condition.value);
        case 'notEqual':
            return String(condition.field) !== String(condition.value);
        case 'contains':
            return String(condition.field).includes(String(condition.value));
        case 'notContains':
            return !String(condition.field).includes(String(condition.value));
        case 'greaterThan':
            return Number(condition.field) > Number(condition.value);
        case 'lessThan':
            return Number(condition.field) < Number(condition.value);
        case 'greaterThanOrEqual':
            return Number(condition.field) >= Number(condition.value);
        case 'lessThanOrEqual':
            return Number(condition.field) <= Number(condition.value);
        case 'in':
            if (!condition.value) {
                return false;
            }
            const valueList = parseValueList(condition.value);
            const fieldValueStr = String(condition.field);
            return valueList.some((v) => v === fieldValueStr);
        case 'notIn':
            if (!condition.value) {
                return true;
            }
            const valueListNotIn = parseValueList(condition.value);
            const fieldValueStrNotIn = String(condition.field);
            return !valueListNotIn.some((v) => v === fieldValueStrNotIn);
        case 'dateBetween':
            if (!condition.value || !condition.value2) {
                return false;
            }
            const fieldDate = new Date(condition.field);
            const date1 = new Date(condition.value);
            const date2 = new Date(condition.value2);
            return fieldDate >= date1 && fieldDate <= date2;
        case 'isEmpty':
            return (
                condition.field === undefined ||
                condition.field === null ||
                condition.field === '' ||
                (Array.isArray(condition.field) && condition.field.length === 0) ||
                (typeof condition.field === 'object' && Object.keys(condition.field).length === 0)
            );
        case 'isNotEmpty':
            return !(
                condition.field === undefined ||
                condition.field === null ||
                condition.field === '' ||
                (Array.isArray(condition.field) && condition.field.length === 0) ||
                (typeof condition.field === 'object' && Object.keys(condition.field).length === 0)
            );
        case 'exists':
            return condition.field !== undefined && condition.field !== null;
        case 'notExists':
            return condition.field === undefined || condition.field === null;
        default:
            return false;
    }
}

// Функция для парсинга значения списка
const parseValueList = (value: any): string[] => {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter((v) => v !== '');
    }
    const strValue = String(value);

    return strValue
        .split(/[,\n]/)
        .map((v) => v.trim())
        .filter((v) => v !== '');
};