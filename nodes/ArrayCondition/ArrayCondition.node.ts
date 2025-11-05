import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class ArrayCondition implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Array Condition',
		name: 'arrayCondition',
		icon: { light: 'file:arrayCondition.svg', dark: 'file:arrayCondition.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Check condition for all elements in an array',
		defaults: {
			name: 'Array Condition',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
		outputNames: ['True', 'False'],
		properties: [
			{
				displayName: 'Array Path',
				name: 'arrayPath',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., body.TaxReg10101Info.Body.RegisterRecord or {{$json.body.RegisterRecord}}',
				description:
					'Path to the array in the JSON data. Use dot notation (e.g., body.array) or expression (e.g., {{$json.body.array}})',
			},
			{
				displayName: 'Conditions',
				name: 'conditions',
				type: 'collection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Condition',
				},
				default: {},
				placeholder: 'Add Condition',
				options: [
					{
						displayName: 'Field Path',
						name: 'fieldPath',
						type: 'string',
						default: '',
						placeholder: 'e.g., CounterpartyInfo.CounterpartyType or recordId',
						description:
							'Path to the field to check in each array element. Use dot notation (e.g., CounterpartyInfo.CounterpartyType) or direct field name',
					},
					{
						displayName: 'Operation',
						name: 'operation',
						type: 'options',
						options: [
							{
								name: 'Equal',
								value: 'equal',
							},
							{
								name: 'Not Equal',
								value: 'notEqual',
							},
							{
								name: 'Contains',
								value: 'contains',
							},
							{
								name: 'Not Contains',
								value: 'notContains',
							},
							{
								name: 'Greater Than',
								value: 'greaterThan',
							},
							{
								name: 'Less Than',
								value: 'lessThan',
							},
							{
								name: 'Greater Than or Equal',
								value: 'greaterThanOrEqual',
							},
							{
								name: 'Less Than or Equal',
								value: 'lessThanOrEqual',
							},
							{
								name: 'Exists',
								value: 'exists',
							},
							{
								name: 'Not Exists',
								value: 'notExists',
							},
						],
						default: 'equal',
						description: 'The operation to perform',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						displayOptions: {
							hide: {
								operation: ['exists', 'notExists'],
							},
						},
						placeholder: 'e.g., 2',
						description: 'Value to compare against (supports expressions)',
					},
				],
				description: 'Conditions to check for each array element',
			},
			{
				displayName: 'Combine Conditions',
				name: 'combineConditions',
				type: 'options',
				options: [
					{
						name: 'All Conditions Must Match (AND)',
						value: 'and',
						description: 'All conditions must be true',
					},
					{
						name: 'At Least One Condition Must Match (OR)',
						value: 'or',
						description: 'At least one condition must be true',
					},
				],
				default: 'and',
				description: 'How to combine multiple conditions',
			},
			{
				displayName: 'Check Mode',
				name: 'checkMode',
				type: 'options',
				options: [
					{
						name: 'All Elements Must Match',
						value: 'all',
						description: 'All array elements must match all conditions (AND)',
					},
					{
						name: 'At Least One Element Must Match',
						value: 'any',
						description: 'At least one array element must match all conditions (OR)',
					},
				],
				default: 'all',
				description: 'How to check across array elements',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnDataTrue: INodeExecutionData[] = [];
		const returnDataFalse: INodeExecutionData[] = [];

		// Helper function to perform a single comparison
		const performComparison = (
			fieldValue: any,
			operation: string,
			compareValue: any,
		): boolean => {
			switch (operation) {
				case 'equal':
					return String(fieldValue) === String(compareValue);
				case 'notEqual':
					return String(fieldValue) !== String(compareValue);
				case 'contains':
					return String(fieldValue).includes(String(compareValue));
				case 'notContains':
					return !String(fieldValue).includes(String(compareValue));
				case 'greaterThan':
					return Number(fieldValue) > Number(compareValue);
				case 'lessThan':
					return Number(fieldValue) < Number(compareValue);
				case 'greaterThanOrEqual':
					return Number(fieldValue) >= Number(compareValue);
				case 'lessThanOrEqual':
					return Number(fieldValue) <= Number(compareValue);
				case 'exists':
					return fieldValue !== undefined && fieldValue !== null;
				case 'notExists':
					return fieldValue === undefined || fieldValue === null;
				default:
					return false;
			}
		};

		// Helper function to get field value from array item
		const getFieldValue = (arrayItem: any, fieldPath: string): any => {
			if (!fieldPath) {
				return arrayItem;
			}
			const pathParts = fieldPath.split('.');
			let value = arrayItem;
			for (const part of pathParts) {
				if (value && typeof value === 'object' && part in value) {
					value = value[part];
				} else {
					return undefined;
				}
			}
			return value;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const arrayPathParam = this.getNodeParameter('arrayPath', itemIndex, '') as any;
				const conditionsCollection = this.getNodeParameter('conditions', itemIndex, {}) as any;
				const combineConditions = this.getNodeParameter('combineConditions', itemIndex, 'and') as string;
				const checkMode = this.getNodeParameter('checkMode', itemIndex, 'all') as string;
				const item = items[itemIndex];

				// Resolve array path
				let array: any[];

				if (Array.isArray(arrayPathParam)) {
					array = arrayPathParam;
				} else {
					const pathToUse = String(arrayPathParam);
					const pathParts = pathToUse.replace(/^\$json\./, '').split('.');
					let value: any = item.json;
					for (const part of pathParts) {
						if (value && typeof value === 'object' && part in value) {
							value = value[part];
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Array path "${pathToUse}" not found in item ${itemIndex}`,
								{ itemIndex },
							);
						}
					}
					array = Array.isArray(value) ? value : [value];
				}

				if (!Array.isArray(array)) {
					throw new NodeOperationError(
						this.getNode(),
						`Path "${arrayPathParam}" does not point to an array`,
						{ itemIndex },
					);
				}

				if (array.length === 0) {
					returnDataFalse.push(item);
					continue;
				}

				// Convert conditions collection to array
				// Collection with multipleValues returns array of objects
				const conditions: Array<{
					fieldPath: string;
					operation: string;
					value: any;
				}> = [];

				if (conditionsCollection && typeof conditionsCollection === 'object') {
					// Check if it's already an array (from multipleValues)
					if (Array.isArray(conditionsCollection)) {
						// Process array of conditions
						for (const condition of conditionsCollection) {
							if (condition && typeof condition === 'object') {
								const fieldPath = condition.fieldPath;
								if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
									conditions.push({
										fieldPath: String(fieldPath),
										operation: (condition.operation as string) || 'equal',
										value: condition.value,
									});
								}
							}
						}
					} else {
						// Convert object with numbered keys to array (fallback format)
						const keys = Object.keys(conditionsCollection).sort();
						for (const key of keys) {
							const condition = conditionsCollection[key];
							if (condition && typeof condition === 'object') {
								const fieldPath = condition.fieldPath;
								if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
									conditions.push({
										fieldPath: String(fieldPath),
										operation: (condition.operation as string) || 'equal',
										value: condition.value,
									});
								}
							}
						}
					}
				}

				if (conditions.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one condition with a valid Field Path must be specified',
						{ itemIndex },
					);
				}

				// Check each element in the array
				const elementResults: boolean[] = [];

				for (let i = 0; i < array.length; i++) {
					const arrayItem = array[i];
					const conditionResults: boolean[] = [];

					// Check all conditions for this array element
					for (const condition of conditions) {
						// Resolve fieldPath - handle expressions that might start with = or {{ }}
						let resolvedFieldPath = condition.fieldPath;
						if (typeof resolvedFieldPath === 'string') {
							// Remove expression markers if present
							resolvedFieldPath = resolvedFieldPath.trim();
							// Handle = prefix (short expression syntax)
							if (resolvedFieldPath.startsWith('=')) {
								resolvedFieldPath = resolvedFieldPath.substring(1).trim();
								// Remove $item. or $json. prefix if present
								if (resolvedFieldPath.startsWith('$item.')) {
									resolvedFieldPath = resolvedFieldPath.substring(6);
								} else if (resolvedFieldPath.startsWith('$json.')) {
									resolvedFieldPath = resolvedFieldPath.substring(6);
								}
							}
							// Handle {{ }} expression syntax
							if (resolvedFieldPath.startsWith('{{') && resolvedFieldPath.endsWith('}}')) {
								resolvedFieldPath = resolvedFieldPath.slice(2, -2).trim();
								// Remove $json. or $item. prefix if present
								if (resolvedFieldPath.startsWith('$json.')) {
									resolvedFieldPath = resolvedFieldPath.substring(6);
								} else if (resolvedFieldPath.startsWith('$item.')) {
									resolvedFieldPath = resolvedFieldPath.substring(6);
								}
							}
						}

						const fieldValue = getFieldValue(arrayItem, resolvedFieldPath);
						let compareValue: any = null;

						// Get comparison value (if needed)
						if (condition.operation !== 'exists' && condition.operation !== 'notExists') {
							// Use value directly - it should already be resolved by getNodeParameter
							// For expressions with $item context, user should use expressions in the value field
							compareValue = condition.value;
						}

						const conditionResult = performComparison(
							fieldValue,
							condition.operation,
							compareValue,
						);
						conditionResults.push(conditionResult);
					}

					// Combine condition results for this element
					let elementMatches: boolean;
					if (combineConditions === 'and') {
						elementMatches = conditionResults.every((r) => r === true);
					} else {
						elementMatches = conditionResults.some((r) => r === true);
					}

					elementResults.push(elementMatches);
				}

				// Determine final result based on check mode
				let finalResult: boolean;
				if (checkMode === 'all') {
					finalResult = elementResults.every((r) => r === true);
				} else {
					finalResult = elementResults.some((r) => r === true);
				}

				// Add metadata about the check
				const outputItem: INodeExecutionData = {
					json: {
						...item.json,
						_arrayCondition: {
							matched: finalResult,
							totalElements: array.length,
							matchedElements: elementResults.filter((r) => r).length,
							conditionsCount: conditions.length,
							combineMode: combineConditions,
							checkMode: checkMode,
							results: elementResults,
						},
					},
					pairedItem: { item: itemIndex },
				};

				if (finalResult) {
					returnDataTrue.push(outputItem);
				} else {
					returnDataFalse.push(outputItem);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnDataFalse.push({
						json: { ...items[itemIndex].json, error: error.message },
						pairedItem: { item: itemIndex },
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return [returnDataTrue, returnDataFalse];
	}
}

