import { ConditionModel, ConditionsWrapper } from "../models/ConditionModels";
import { isNullOrUndefined } from "./BaseMethods";

// Функция для фильтрации массива по условиям
export const filterArraysByConditions = (array: any[][], conditions: ConditionsWrapper): any[][] => {
    return array.filter((item) => conditions.conditions?.some((condition) => performConditionGroup(conditions, item)));
}

// Функция для выполнения группы условий
export const performConditionGroup = (conditionGroup: ConditionsWrapper, array: any[]): boolean => {
    
    if(conditionGroup.conditions == null || conditionGroup.conditions == undefined){
        return true;
    }

    isNullOrUndefined(conditionGroup.conditions, 'Conditions are required');

    const combineConditions = conditionGroup.conditions?.map((condition) => condition.combineNext);
   
    if(combineConditions == null || combineConditions == undefined){
        return true;
    }

    isNullOrUndefined(combineConditions, 'Combine conditions are required');
   
    let result = conditionGroup.conditions.map((condition) => performCondition(condition, array));

    if(combineConditions.includes('and') && result.some((r) => r === false)){
        return false;
    }

    if(combineConditions.includes('or') && result.some((r) => r === true)){
        return true;
    }


    for(let i = 0; i < combineConditions.length; i++){
            if(combineConditions[i] === 'and'){
                if(!(result[i] && result[i+1])){
                    result[i] = false;
                    result[i+1] = false;
                }
            }
    }

   for(let i = 0; i < combineConditions.length; i++){
        if(combineConditions[i] === 'or'){
            if((result[i] || result[i+1])){
                return true;
            }
        }
    }
    return false;
}



// Функция для выполнения условия
export const performCondition = (condition: ConditionModel, array: any[]): boolean => {

    const field = array[condition.fieldNumber - 1];

    switch (condition.operation) {
        case 'equal':
            return String(field) === String(condition.value);
        case 'notEqual':
            return String(field) !== String(condition.value);
        case 'contains':
            return String(field).includes(String(condition.value));
        case 'notContains':
            return !String(field).includes(String(condition.value));
        case 'greaterThan':
            return Number(field) > Number(condition.value);
        case 'lessThan':
            return Number(field) < Number(condition.value);
        case 'greaterThanOrEqual':
            return Number(field) >= Number(condition.value);
        case 'lessThanOrEqual':
            return Number(field) <= Number(condition.value);
        case 'in':
            if (!condition.value) {
                return false;
            }
            const valueList = parseValueList(condition.value);
            const fieldValueStr = String(field);
            return valueList.some((v) => v === fieldValueStr);
        case 'notIn':
            if (!condition.value) {
                return true;
            }
            const valueListNotIn = parseValueList(condition.value);
            const fieldValueStrNotIn = String(field);
            return !valueListNotIn.some((v) => v === fieldValueStrNotIn);
        case 'dateBetween':
            if (!condition.value || !condition.value2) {
                return false;
            }
            const fieldDate = new Date(field);
            const date1 = new Date(condition.value);
            const date2 = new Date(condition.value2);
            return fieldDate >= date1 && fieldDate <= date2;
        case 'isEmpty':
            return (
                field === undefined ||
                field === null ||
                field === '' ||
                (Array.isArray(field) && field.length === 0) ||
                (typeof field === 'object' && Object.keys(field).length === 0)
            );
        case 'isNotEmpty':
            return !(
                field === undefined ||
                field === null ||
                field === '' ||
                (Array.isArray(field) && field.length === 0) ||
                (typeof field === 'object' && Object.keys(field).length === 0)
            );
        case 'exists':
            return field !== undefined && field !== null;
        case 'notExists':
            return field === undefined || field === null;
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