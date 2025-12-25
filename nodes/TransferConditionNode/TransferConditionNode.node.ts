import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes} from 'n8n-workflow';
import { filterRegistersByConditions, GetRegisters } from '../../methods/RegisterMethods';
import { BlocksWrapper, PostConditionsWrapper } from '../../models/ConditionModels';
import { performRegisterPostConditions } from '../../methods/RegisterMethods';

export class TransferConditionNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Transfer Condition',
		name: 'transferCondition',
		icon: { light: 'file:transferCondition.svg', dark: 'file:transferCondition.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Transfer data based on condition',
		defaults: {
			name: 'Transfer Condition',
		},
            inputs: [NodeConnectionTypes.Main],
            outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
			outputNames: ['True', 'False'],
            properties: [
                {
                    displayName: 'Блоки условий',
                    name: 'blocks',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,  // Можно добавлять несколько блоков
                    },
                    default: {},
                    options: [
                        {
                            displayName: 'Блок',
                            name: 'block',
                            values: [
                                // Поле - одно на блок
                                {
                                    displayName: 'Номер регистра',
                                    name: 'registerNumber',
                                    type: 'number',
                                    default: 0,
                                    description: 'Номер регистра для проверки',
                                },
                                // Вложенный массив условий для этого поля
                                {
                                    displayName: 'Условия',
                                    name: 'conditions',
                                    type: 'fixedCollection',
                                    typeOptions: {
                                        multipleValues: true,  // Несколько условий на одно поле
                                    },
                                    default: {},
                                    options: [
                                        {
                                            displayName: 'Условие',
                                            name: 'condition',
                                            values: [
												{
													displayName: 'Номер поля',
													name: 'fieldNumber',
													type: 'number',
													default: 0,
													description: 'Номер поля для проверки',
												},
                                                {
                                                    displayName: 'Операция',
                                                    name: 'operation',
                                                    type: 'options',
                                                    options: [
                                                        { name: 'Равно', value: 'equal' },
                                                        { name: 'Не равно', value: 'notEqual' },
                                                        { name: 'Содержит', value: 'contains' },
                                                        { name: 'Не содержит', value: 'notContains' },
                                                        { name: 'Больше', value: 'greaterThan' },
                                                        { name: 'Меньше', value: 'lessThan' },
                                                        { name: 'Больше или равно', value: 'greaterThanOrEqual' },
                                                        { name: 'Меньше или равно', value: 'lessThanOrEqual' },
                                                        { name: 'В списке', value: 'in' },
                                                        { name: 'Не в списке', value: 'notIn' },
                                                        { name: 'Между датами', value: 'dateBetween' },
                                                        { name: 'Пусто', value: 'isEmpty' },
                                                        { name: 'Не пусто', value: 'isNotEmpty' },
                                                        { name: 'Существует', value: 'exists' },
                                                        { name: 'Не существует', value: 'notExists' },
                                                    ],
                                                    default: 'equal',
                                                },
                                                {
                                                    displayName: 'Значение',
                                                    name: 'value',
                                                    type: 'string',
                                                    typeOptions: {
                                                        rows: 3,
                                                    },
                                                    default: '',
                                                    displayOptions: {
                                                        hide: {
                                                            operation: ['exists', 'notExists', 'isEmpty', 'isNotEmpty'],
                                                        },
                                                    },
                                                    description: 'Значение для сравнения. Для операций "В списке" и "Не в списке" можно указать несколько значений через запятую или с новой строки',
                                                },
												{
													displayName: 'Значение 2 (для "Между датами")',
													name: 'value2',
													type: 'string',
													default: '',
													displayOptions: {
                                                        show: {
                                                            operation: ['dateBetween'],
                                                        },
                                                    },
													description: 'Второе значение даты для операции "Между датами"',
												},
												{
													displayName: 'Объединение с следующим условием',
													name: 'combineNext',
													type: 'options',
													options: [
														{ name: 'И', value: 'and' },
														{ name: 'ИЛИ', value: 'or' },
													],
													default: 'and',
												}
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    displayName: 'Пост-условия',
                    name: 'postConditions',
                    type: 'fixedCollection',
                    typeOptions: {
                        multipleValues: true,
                    },
                    default: {},
                    description: 'Условия для сравнения полей между регистрами после фильтрации',
                    options: [
                        {
                            displayName: 'Пост-условие',
                            name: 'postCondition',
                            values: [
                                {
                                    displayName: 'Номер регистра (левое поле)',
                                    name: 'fieldLeftRegisterNumber',
                                    type: 'string',
                                    default: 0,
                                    description: 'Номер регистра для левого поля',
                                },
                                {
                                    displayName: 'Номер поля (левое поле)',
                                    name: 'fieldLeftFieldNumber',
                                    type: 'number',
                                    default: 0,
                                    description: 'Номер поля в регистре для левого поля',
                                },
                                {
                                    displayName: 'Операция',
                                    name: 'operation',
                                    type: 'options',
                                    options: [
                                        { name: 'Равно', value: 'equal' },
                                        { name: 'Не равно', value: 'notEqual' },
                                        { name: 'Больше', value: 'greaterThan' },
                                        { name: 'Меньше', value: 'lessThan' },
                                        { name: 'Больше или равно', value: 'greaterThanOrEqual' },
                                        { name: 'Меньше или равно', value: 'lessThanOrEqual' },
                                    ],
                                    default: 'equal',
                                    description: 'Операция сравнения между полями',
                                },
                                {
                                    displayName: 'Номер регистра (правое поле)',
                                    name: 'fieldRightRegisterNumber',
                                    type: 'string',
                                    default: 0,
                                    description: 'Номер регистра для правого поля',
                                },
                                {
                                    displayName: 'Номер поля (правое поле)',
                                    name: 'fieldRightFieldNumber',
                                    type: 'number',
                                    default: 0,
                                    description: 'Номер поля в регистре для правого поля',
                                },
                            ],
                        },
                    ],
                },
            ],
        };

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>  {
			console.log('========================================');
			console.log('[TransferCondition] EXECUTE CALLED!!!');
			console.log('========================================');
			debugger;
			
			const items = this.getInputData();
			
			const complectRegisters = GetRegisters(items);

			const conditinsBlocks = this.getNodeParameter('blocks', 0) as BlocksWrapper;

			const filteredRegisters = filterRegistersByConditions(complectRegisters.registers, conditinsBlocks);

			const postConditions = this.getNodeParameter('postConditions', 0) as PostConditionsWrapper;

			const resultPostConditions = true;
			

			console.log('resultPostConditions', resultPostConditions);

			if(resultPostConditions){
				return [items, []];
			} else {
				return [[], items];
			}

		
		}
    }