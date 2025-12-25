import { ConditionModel} from "../models/ConditionModels";
import { isNullOrUndefined } from "./BaseMethods";


// Функция для фильтрации массива по условиям
export const filterArraysByConditions = (array: any[][], conditions: ConditionModel[]): any[][] => {
    return array.filter((item) => performConditionGroup(conditions, item));
}

// Функция для выполнения группы условий
export const performConditionGroup = (conditionGroup: ConditionModel[] | any, array: any[]): boolean => {
    
    if(conditionGroup == null || conditionGroup == undefined){
        return true;
    }

    // Проверяем, что conditionGroup - массив
    if (!Array.isArray(conditionGroup)) {
        return true; // Если не массив, считаем что условие выполнено (нет условий)
    }

    if(conditionGroup.length === 0){
        return true; // Если массив пустой, условие выполнено
    }

    const combineConditions = conditionGroup.map((condition) => condition.combineNext);
   
    if(combineConditions == null || combineConditions == undefined){
        return true;
    }

    isNullOrUndefined(combineConditions, 'Combine conditions are required');
   
    let result = conditionGroup.map((condition) => performCondition(condition, array));

    for(let i = 0; i < combineConditions.length; i++){
            if(combineConditions[i] === 'and'){
                if(result.length > i+1){
                    if(!(result[i] && result[i+1])){
                        result[i] = false;
                        result[i+1] = false;
                    }
                }
                if(result[i] === false){
                    result[i] = false;
                }
            }
    }

   for(let i = 0; i < combineConditions.length; i++){
        if(combineConditions[i] === 'or'){
            if(result[i] === true){
                return true;
            }
            if(result.length > i+1){
                if(result[i+1] === true){
                    return true;
                }
            }
        }
    }

    if(result.some((r) => r === true)){
        return true;
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