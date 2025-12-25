import { INodeExecutionData } from "n8n-workflow";
import { ComplectRegisterModel, RegisterModel } from "../models/RegisterModels";
import { BlockModel, ConditionModel, BlocksWrapper } from "../models/ConditionModels";
import { performConditionGroup } from "./ConditionMethods";
import { PostConditionsWrapper} from "../models/ConditionModels";


export const performRegisterPostConditions = (registers: { [key: string]: RegisterModel }, conditions: PostConditionsWrapper): boolean => {
    return conditions.postConditions?.every((condition): boolean => {
        const fiendsRight = registers[condition.fieldRight.registerNumber].table.map((row) => row[condition.fieldRight.fieldNumber - 1]);
        console.log('fiendsRight', fiendsRight);
        const fiendsLeft = registers[condition.fieldLeft.registerNumber].table.map((row) => row[condition.fieldLeft.fieldNumber - 1]);
        console.log('fiendsLeft', fiendsLeft);
        console.log('fiendsLeft.length >= fiendsRight.length', fiendsLeft.length >= fiendsRight.length);
        if(fiendsLeft.length >= fiendsRight.length){
            return false;
        }
        return fiendsRight.every((fieldRight) => {fiendsLeft.find((fieldLeft) => fieldLeft === fieldRight)});
    }) || true;
}

export const filterRegistersByConditions = (registers: { [key: string]: RegisterModel }, conditionsWrapper: BlocksWrapper): { [key: string]: RegisterModel } => {
    const blocks: BlockModel[] = conditionsWrapper?.block || [];
    
    return Object.keys(registers).reduce((acc, key) => {
        acc[key] = filterRegisterByConditions(registers[key], getConditionsByRegisterNumber(blocks, parseInt(key)));
        return acc;
    }, {} as { [key: string]: RegisterModel });
}

const getConditionsByRegisterNumber = (blocks: BlockModel[], registerNumber: number): ConditionModel[] => {
    if (!Array.isArray(blocks)) {
        return [];
    }
    const block = blocks.find(block => block.registerNumber === registerNumber);
    if (!block || !block.conditions) {
        return [];
    }
    return normalizeConditions(block.conditions);
}

// Нормализует conditions из fixedCollection (может быть объектом или массивом)
const normalizeConditions = (conditions: any): ConditionModel[] => {
    if (!conditions) {
        return [];
    }
    
    if (Array.isArray(conditions)) {
        return conditions.filter((condition: any) => condition && typeof condition === 'object');
    }
    
    if (typeof conditions === 'object') {
        if (conditions.condition) {
            const conditionArray = Array.isArray(conditions.condition) 
                ? conditions.condition 
                : [conditions.condition];
            return conditionArray.filter((condition: any) => condition && typeof condition === 'object');
        }
        
        const keys = Object.keys(conditions).sort((a, b) => {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.localeCompare(b);
        });
        
        const result: ConditionModel[] = [];
        for (const key of keys) {
            const condition = conditions[key];
            if (condition && typeof condition === 'object') {
                if (condition.condition) {
                    const conditionArray = Array.isArray(condition.condition) 
                        ? condition.condition 
                        : [condition.condition];
                    result.push(...conditionArray.filter((c: any) => c && typeof c === 'object'));
                } else if (condition.fieldNumber !== undefined) {
                    result.push(condition);
                }
            }
        }
        return result;
    }
    
    return [];
}

const filterRegisterByConditions = (register: RegisterModel, conditions: ConditionModel[]): RegisterModel => {
    return {
        header: [...register.header],
        table: register.table.filter(row => performConditionGroup(conditions, row))
    };
}


export const GetRegisters = (items: INodeExecutionData[]) : ComplectRegisterModel => {

    for(let i = 0; i < items.length; i++){
        const body = items[i].json['body'];
        if(body != null && body != undefined){
            const registers = body as any['registers'] as ComplectRegisterModel;
            if(registers != null && registers != undefined){
                return registers;
            }
            throw new Error('Registers not found in body');
        }
    }
    throw new Error('Registers not found in body');
}