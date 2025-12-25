import { INodeExecutionData } from "n8n-workflow";
import { ComplectRegisterModel } from "../models/RegisterModels";

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