import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes} from 'n8n-workflow';
import { GetRegisters } from '../../methods/RegisterMethods';
import { BlocksWrapper } from '../../models/ConditionModels';

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
            outputs: [NodeConnectionTypes.Main],
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
                                                    ],
                                                    default: 'equal',
                                                },
                                                {
                                                    displayName: 'Значение',
                                                    name: 'value',
                                                    type: 'string',
                                                    default: '',
                                                },
												{
													displayName: 'Значение 2 (для DateBetween)',
													name: 'value2',
													type: 'string',
													default: '',
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
            ],
        };

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>  {
			console.log('========================================');
			console.log('[TransferCondition] EXECUTE CALLED!!!');
			console.log('========================================');
			debugger;
			
			const items = this.getInputData();
			
			const registers = GetRegisters(items);

			const conditinsBlocks = this.getNodeParameter('blocks', 0) as BlocksWrapper;

			console.log('conditinsBlocks', conditinsBlocks);
			console.log('registers', registers);
			
			return [items];
		}
    }