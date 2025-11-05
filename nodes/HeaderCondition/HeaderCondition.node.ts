import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class HeaderCondition implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Header Condition',
		name: 'headerCondition',
		icon: { light: 'file:headerCondition.svg', dark: 'file:headerCondition.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Check complex conditions on header data with AND/OR logic',
		defaults: {
			name: 'Header Condition',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main, NodeConnectionTypes.Main],
		outputNames: ['True', 'False'],
		properties: [
			{
				displayName: 'Header Path',
				name: 'headerPath',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., body.header or {{$json.body.header}}',
				description:
					'Path to the header data. Use dot notation (e.g., body.header) or expression (e.g., {{$json.body.header}})',
			},
			{
				displayName: 'Condition Groups',
				name: 'conditionGroups',
				type: 'collection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Condition Group',
				},
				default: {},
				placeholder: 'Add Condition Group',
				description:
					'Groups of conditions combined with OR. Each group contains conditions combined with AND',
				options: [
					{
						displayName: 'Combine Conditions in Group',
						name: 'combineConditions',
						type: 'options',
						options: [
							{
								name: 'All Conditions Must Match (AND)',
								value: 'and',
								description: 'All conditions in this group must be true',
							},
							{
								name: 'At Least One Condition Must Match (OR)',
								value: 'or',
								description: 'At least one condition in this group must be true',
							},
						],
						default: 'and',
						description: 'How to combine conditions within this group',
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
						description: 'Conditions in this group',
						options: [
							{
								displayName: 'Field Path',
								name: 'fieldPath',
								type: 'string',
								default: '',
								placeholder: 'e.g., [0] or field.subfield',
								description:
									'Path to the field. For arrays use [0], [1], etc. Use dot notation for objects (e.g., field.subfield)',
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
										name: 'In',
										value: 'in',
										description: 'Check if field value is in a list of values (comma-separated or newline-separated)',
									},
									{
										name: 'Not In',
										value: 'notIn',
										description: 'Check if field value is not in a list of values (comma-separated or newline-separated)',
									},
									{
										name: 'Date Between',
										value: 'dateBetween',
										description: 'Check if date is between two dates (inclusive)',
									},
									{
										name: 'Is Empty',
										value: 'isEmpty',
										description: 'Check if field is empty (null, undefined, empty string)',
									},
									{
										name: 'Is Not Empty',
										value: 'isNotEmpty',
										description: 'Check if field is not empty',
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
								typeOptions: {
									rows: 3,
								},
								default: '',
								displayOptions: {
									hide: {
										operation: ['exists', 'notExists', 'isEmpty', 'isNotEmpty'],
									},
								},
								placeholder: 'e.g., 1 or "value1, value2, value3" for In/Not In operations',
								description:
									'Value to compare against. For "In" and "Not In" operations, use comma-separated or newline-separated values (supports expressions)',
							},
							{
								displayName: 'Value 2 (for Date Between)',
								name: 'value2',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										operation: ['dateBetween'],
									},
								},
								placeholder: 'e.g., 2021-12-31',
								description: 'End date for date range (inclusive)',
							},
						],
					},
					{
						displayName: 'Action if Group Matches',
						name: 'action',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Action',
								name: 'action',
								values: [
									{
										displayName: 'Check Condition Before Action',
										name: 'checkCondition',
										type: 'boolean',
										default: false,
										description: 'Whether to check a condition before performing the action',
									},
									{
										displayName: 'Condition Field Path',
										name: 'conditionFieldPath',
										type: 'string',
										default: '',
										displayOptions: {
											show: {
												checkCondition: [true],
											},
										},
										placeholder: 'e.g., [4] or field.subfield',
										description:
											'Field path to check. For arrays use [0], [1], etc. Use dot notation for objects',
									},
									{
										displayName: 'Condition Operation',
										name: 'conditionOperation',
										type: 'options',
										displayOptions: {
											show: {
												checkCondition: [true],
											},
										},
										options: [
											{
												name: 'Is Empty',
												value: 'isEmpty',
											},
											{
												name: 'Is Not Empty',
												value: 'isNotEmpty',
											},
											{
												name: 'Equal',
												value: 'equal',
											},
											{
												name: 'Not Equal',
												value: 'notEqual',
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
										default: 'isNotEmpty',
										description: 'The condition to check',
									},
									{
										displayName: 'Condition Value',
										name: 'conditionValue',
										type: 'string',
										default: '',
										displayOptions: {
											show: {
												checkCondition: [true],
												conditionOperation: ['equal', 'notEqual'],
											},
										},
										placeholder: 'e.g., 1',
										description: 'Value to compare against',
									},
									{
										displayName: 'Target Field',
										name: 'targetField',
										type: 'string',
										default: '',
										placeholder: 'e.g., [4] or field.subfield or result',
										description:
											'Field path where to store the result. For arrays use [0], [1], etc. Use dot notation to create nested objects',
									},
									{
										displayName: 'Expression',
										name: 'expression',
										type: 'string',
										typeOptions: {
											rows: 3,
										},
										default: '',
										placeholder: 'e.g., {{ $item.field1 }} or {{ "value" }}',
										description:
											'Expression to evaluate and store. Use $item to reference header data. Supports expressions.',
									},
								],
							},
						],
						description: 'Action to perform when this condition group matches',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnDataTrue: INodeExecutionData[] = [];
		const returnDataFalse: INodeExecutionData[] = [];

		// Helper function to parse list of values for "in" and "notIn" operations
		const parseValueList = (value: any): string[] => {
			if (!value) {
				return [];
			}
			if (Array.isArray(value)) {
				return value.map((v) => String(v).trim()).filter((v) => v !== '');
			}
			const strValue = String(value);
			// Split by comma or newline
			return strValue
				.split(/[,\n]/)
				.map((v) => v.trim())
				.filter((v) => v !== '');
		};

		// Helper function to perform a single comparison
		const performComparison = (
			fieldValue: any,
			operation: string,
			compareValue: any,
			compareValue2?: any,
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
				case 'in':
					if (!compareValue) {
						return false;
					}
					const valueList = parseValueList(compareValue);
					const fieldValueStr = String(fieldValue);
					return valueList.some((v) => v === fieldValueStr);
				case 'notIn':
					if (!compareValue) {
						return true;
					}
					const valueListNotIn = parseValueList(compareValue);
					const fieldValueStrNotIn = String(fieldValue);
					return !valueListNotIn.some((v) => v === fieldValueStrNotIn);
				case 'dateBetween':
					if (!compareValue || !compareValue2) {
						return false;
					}
					const fieldDate = new Date(fieldValue);
					const date1 = new Date(compareValue);
					const date2 = new Date(compareValue2);
					return fieldDate >= date1 && fieldDate <= date2;
				case 'isEmpty':
					return (
						fieldValue === undefined ||
						fieldValue === null ||
						fieldValue === '' ||
						(Array.isArray(fieldValue) && fieldValue.length === 0) ||
						(typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0)
					);
				case 'isNotEmpty':
					return !(
						fieldValue === undefined ||
						fieldValue === null ||
						fieldValue === '' ||
						(Array.isArray(fieldValue) && fieldValue.length === 0) ||
						(typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0)
					);
				case 'exists':
					return fieldValue !== undefined && fieldValue !== null;
				case 'notExists':
					return fieldValue === undefined || fieldValue === null;
				default:
					return false;
			}
		};

		// Helper function to get field value from header
		// Supports both object paths (field.subfield) and array indices ([0], [1])
		const getFieldValue = (headerData: any, fieldPath: string): any => {
			if (!fieldPath) {
				return headerData;
			}

			// Trim whitespace from fieldPath
			fieldPath = fieldPath.trim();

			// Handle array indices like [0], [1], etc. (with or without spaces)
			if (fieldPath.startsWith('[') && fieldPath.endsWith(']')) {
				// Extract index, removing spaces
				const indexStr = fieldPath.slice(1, -1).trim();
				const index = parseInt(indexStr, 10);
				if (!isNaN(index) && Array.isArray(headerData)) {
					return headerData[index];
				}
				return undefined;
			}

			// Handle dot notation for objects
			const pathParts = fieldPath.split('.');
			let value = headerData;

			for (let i = 0; i < pathParts.length; i++) {
				let part = pathParts[i].trim();

				// Check if part is an array index like [0]
				if (part.startsWith('[') && part.endsWith(']')) {
					// Extract index, removing spaces
					const indexStr = part.slice(1, -1).trim();
					const index = parseInt(indexStr, 10);
					if (!isNaN(index) && Array.isArray(value)) {
						value = value[index];
					} else {
						return undefined;
					}
				} else if (value && typeof value === 'object' && part in value) {
					value = value[part];
				} else {
					return undefined;
				}
			}

			return value;
		};

		// Helper function to set field value in object using dot notation
		// Supports both object paths and array indices
		const setFieldValue = (obj: any, fieldPath: string, value: any): void => {
			if (!fieldPath) {
				return;
			}

			// Trim whitespace from fieldPath
			fieldPath = fieldPath.trim();

			// Handle array indices like [0], [1], etc. (with or without spaces)
			if (fieldPath.startsWith('[') && fieldPath.endsWith(']')) {
				const indexStr = fieldPath.slice(1, -1).trim();
				const index = parseInt(indexStr, 10);
				if (!isNaN(index) && Array.isArray(obj)) {
					obj[index] = value;
				}
				return;
			}

			const pathParts = fieldPath.split('.');
			let current = obj;
			for (let i = 0; i < pathParts.length - 1; i++) {
				let part = pathParts[i].trim();

				// Check if part is an array index like [0]
				if (part.startsWith('[') && part.endsWith(']')) {
					const indexStr = part.slice(1, -1).trim();
					const index = parseInt(indexStr, 10);
					if (!isNaN(index)) {
						if (!Array.isArray(current)) {
							current = [];
						}
						if (current[index] === undefined || current[index] === null) {
							current[index] = {};
						}
						current = current[index];
					} else {
						return;
					}
				} else {
					if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
						current[part] = {};
					}
					current = current[part];
				}
			}

			const lastPart = pathParts[pathParts.length - 1].trim();
			if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
				const indexStr = lastPart.slice(1, -1).trim();
				const index = parseInt(indexStr, 10);
				if (!isNaN(index)) {
					if (!Array.isArray(current)) {
						current = [];
					}
					current[index] = value;
				}
			} else {
				current[lastPart] = value;
			}
		};

		// Helper function to resolve field path from expression
		const resolveFieldPath = (fieldPath: string): string => {
			if (typeof fieldPath !== 'string') {
				return '';
			}
			let resolved = fieldPath.trim();
			// Handle = prefix (short expression syntax)
			if (resolved.startsWith('=')) {
				resolved = resolved.substring(1).trim();
				if (resolved.startsWith('$item.')) {
					resolved = resolved.substring(6);
				} else if (resolved.startsWith('$json.')) {
					resolved = resolved.substring(6);
				}
			}
			// Handle {{ }} expression syntax
			if (resolved.startsWith('{{') && resolved.endsWith('}}')) {
				resolved = resolved.slice(2, -2).trim();
				if (resolved.startsWith('$json.')) {
					resolved = resolved.substring(6);
				} else if (resolved.startsWith('$item.')) {
					resolved = resolved.substring(6);
				}
			}
			// Trim whitespace and normalize array indices (remove spaces inside brackets)
			resolved = resolved.trim();
			// Normalize [ 2 ] to [2]
			resolved = resolved.replace(/\s*\[\s*(\d+)\s*\]\s*/g, '[$1]');
			return resolved;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const headerPathParam = this.getNodeParameter('headerPath', itemIndex, '') as any;
				const conditionGroupsCollection = this.getNodeParameter('conditionGroups', itemIndex, {}) as any;
				const item = items[itemIndex];

				// Resolve header path
				let headerData: any;

				if (Array.isArray(headerPathParam)) {
					headerData = headerPathParam[0]; // Take first element if array
				} else {
					const pathToUse = String(headerPathParam);
					const pathParts = pathToUse.replace(/^\$json\./, '').split('.');
					let value: any = item.json;
					for (const part of pathParts) {
						if (value && typeof value === 'object' && part in value) {
							value = value[part];
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Header path "${pathToUse}" not found in item ${itemIndex}`,
								{ itemIndex },
							);
						}
					}
					headerData = value;
				}

				if (headerData === undefined || headerData === null) {
					throw new NodeOperationError(
						this.getNode(),
						`Header path "${headerPathParam}" is undefined or null`,
						{ itemIndex },
					);
				}

				// Parse condition groups
				const conditionGroups: Array<{
					conditions: Array<{
						fieldPath: string;
						operation: string;
						value: any;
						value2?: any;
					}>;
					combineConditions: string;
					action?: {
						checkCondition: boolean;
						conditionFieldPath?: string;
						conditionOperation?: string;
						conditionValue?: any;
						targetField: string;
						expression: string;
					};
				}> = [];

				if (conditionGroupsCollection && typeof conditionGroupsCollection === 'object') {
					if (Array.isArray(conditionGroupsCollection)) {
						for (const group of conditionGroupsCollection) {
							if (group && typeof group === 'object') {
								const conditionsCollection = group.conditions;
								const combineConditions = group.combineConditions || 'and';
								const action = group.action;

								const conditions: Array<{
									fieldPath: string;
									operation: string;
									value: any;
									value2?: any;
								}> = [];

								if (conditionsCollection && typeof conditionsCollection === 'object') {
									if (Array.isArray(conditionsCollection)) {
										for (const condition of conditionsCollection) {
											if (condition && typeof condition === 'object') {
												const fieldPath = condition.fieldPath;
												if (
													fieldPath !== undefined &&
													fieldPath !== null &&
													String(fieldPath).trim() !== ''
												) {
													conditions.push({
														fieldPath: String(fieldPath),
														operation: (condition.operation as string) || 'equal',
														value: condition.value,
														value2: condition.value2,
													});
												}
											}
										}
									} else {
										const keys = Object.keys(conditionsCollection).sort();
										for (const key of keys) {
											const condition = conditionsCollection[key];
											if (condition && typeof condition === 'object') {
												const fieldPath = condition.fieldPath;
												if (
													fieldPath !== undefined &&
													fieldPath !== null &&
													String(fieldPath).trim() !== ''
												) {
													conditions.push({
														fieldPath: String(fieldPath),
														operation: (condition.operation as string) || 'equal',
														value: condition.value,
														value2: condition.value2,
													});
												}
											}
										}
									}
								}

								// Parse action
								let parsedAction: {
									checkCondition: boolean;
									conditionFieldPath?: string;
									conditionOperation?: string;
									conditionValue?: any;
									targetField: string;
									expression: string;
								} | undefined;
								if (action && typeof action === 'object' && action.action) {
									const actionArray = Array.isArray(action.action) ? action.action : [action.action];
									if (actionArray.length > 0) {
										const actionData = actionArray[0];
										parsedAction = {
											checkCondition: Boolean(actionData.checkCondition),
											conditionFieldPath: actionData.checkCondition
												? String(actionData.conditionFieldPath || '')
												: undefined,
											conditionOperation: actionData.checkCondition
												? String(actionData.conditionOperation || 'isNotEmpty')
												: undefined,
											conditionValue: actionData.checkCondition ? actionData.conditionValue : undefined,
											targetField: String(actionData.targetField || ''),
											expression: String(actionData.expression || ''),
										};
									}
								}

								if (conditions.length > 0) {
									conditionGroups.push({
										conditions,
										combineConditions: String(combineConditions),
										action: parsedAction,
									});
								}
							}
						}
					}
				}

				if (conditionGroups.length === 0) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one condition group must be specified',
						{ itemIndex },
					);
				}

				// Check each condition group (OR logic between groups)
				let matchedGroup: {
					checkCondition: boolean;
					conditionFieldPath?: string;
					conditionOperation?: string;
					conditionValue?: any;
					targetField: string;
					expression: string;
				} | null = null;
				let groupMatched = false;
				let thenConditionPassed = true; // Track if THEN condition passed (default true if no THEN check)

				for (const group of conditionGroups) {
					// Check all conditions in this group
					const conditionResults: boolean[] = [];

					for (const condition of group.conditions) {
						const resolvedFieldPath = resolveFieldPath(condition.fieldPath);
						const fieldValue = getFieldValue(headerData, resolvedFieldPath);
						let compareValue: any = null;
						let compareValue2: any = null;

						if (
							condition.operation !== 'exists' &&
							condition.operation !== 'notExists' &&
							condition.operation !== 'isEmpty' &&
							condition.operation !== 'isNotEmpty'
						) {
							compareValue = condition.value;
							if (condition.operation === 'dateBetween') {
								compareValue2 = condition.value2;
							}
						}

						const conditionResult = performComparison(
							fieldValue,
							condition.operation,
							compareValue,
							compareValue2,
						);

						conditionResults.push(conditionResult);
					}

					// Combine condition results based on combineConditions
					let groupMatches: boolean;
					if (group.combineConditions === 'and') {
						groupMatches = conditionResults.every((r) => r === true);
					} else {
						groupMatches = conditionResults.some((r) => r === true);
					}

					if (groupMatches) {
						groupMatched = true;
						if (group.action) {
							matchedGroup = group.action;
						}
						break; // First matching group wins
					}
				}

				// Perform action if group matched
				const outputItem: INodeExecutionData = {
					json: { ...item.json },
					pairedItem: { item: itemIndex },
				};

				if (groupMatched && matchedGroup) {
					// Check if there's a condition to check before performing the action
					let shouldPerformAction = true;

					if (matchedGroup.checkCondition) {
						const conditionFieldPath = matchedGroup.conditionFieldPath;
						const conditionOperation = matchedGroup.conditionOperation;
						const conditionValue = matchedGroup.conditionValue;

						if (conditionFieldPath && conditionOperation) {
							const resolvedConditionFieldPath = resolveFieldPath(conditionFieldPath);
							const conditionFieldValue = getFieldValue(headerData, resolvedConditionFieldPath);
							let conditionCompareValue: any = null;

							if (
								conditionOperation !== 'exists' &&
								conditionOperation !== 'notExists' &&
								conditionOperation !== 'isEmpty' &&
								conditionOperation !== 'isNotEmpty'
							) {
								conditionCompareValue = conditionValue;
							}

							shouldPerformAction = performComparison(
								conditionFieldValue,
								conditionOperation,
								conditionCompareValue,
							);
							thenConditionPassed = shouldPerformAction;
						}
					}

					if (shouldPerformAction) {
						// Update header data
						const pathToUse = String(headerPathParam);
						const pathParts = pathToUse.replace(/^\$json\./, '').split('.');
						let target: any = outputItem.json;
						for (let i = 0; i < pathParts.length - 1; i++) {
							const part = pathParts[i];
							if (target && typeof target === 'object' && part in target) {
								target = target[part];
							}
						}

						// Evaluate expression
						let result: any = matchedGroup.expression;
						if (typeof result === 'string' && result.includes('{{')) {
							// Simple expression evaluation - replace $item references
							try {
								const itemRegex = /\{\{\s*\$item\.([\w.\[\]]+)\s*\}\}/g;
								result = result.replace(itemRegex, (match: string, path: string) => {
									const value = getFieldValue(headerData, path);
									return value !== undefined ? JSON.stringify(value) : 'undefined';
								});

								// Try to evaluate the expression
								const exprMatch = result.match(/\{\{\s*(.+?)\s*\}\}/);
								if (exprMatch) {
									const expr = exprMatch[1].trim();
									// Remove $item references and evaluate
									const evalExpr = expr.replace(/\$item\.([\w.\[\]]+)/g, (match: string, path: string) => {
										const value = getFieldValue(headerData, path);
										if (value === undefined || value === null) {
											return 'undefined';
										}
										if (typeof value === 'number') {
											return String(value);
										}
										if (typeof value === 'boolean') {
											return String(value);
										}
										return JSON.stringify(value);
									});

									// Replace JSON stringified values
									const finalExpr = evalExpr
										.replace(/"(-?\d+\.?\d*)"/g, (match: string, num: string) => num)
										.replace(/"true"/g, 'true')
										.replace(/"false"/g, 'false')
										.replace(/"null"/g, 'null');

									try {
										const func = new Function(`return ${finalExpr}`);
										result = func();
									} catch (evalError) {
										// Keep original expression if evaluation fails
										result = matchedGroup.expression;
									}
								}
							} catch (error) {
								result = matchedGroup.expression;
							}
						}

						// Set the result in the target field
						if (matchedGroup.targetField && target) {
							if (pathParts.length === 1) {
								// Direct path
								setFieldValue(outputItem.json, matchedGroup.targetField, result);
							} else {
								// Nested path - set in header data
								setFieldValue(target, matchedGroup.targetField, result);
							}
						}
					} else {
						// Condition check failed, mark as not matched
						groupMatched = false;
					}
				}

				// Route to True or False output
				// Logic:
				// - True if no groups matched (ни одна группа не совпала)
				// - True if group matched AND THEN condition passed (группа совпала и THEN выполнено)
				// - False only if group matched BUT THEN condition failed (группа совпала, но THEN не выполнено)
				if (!groupMatched) {
					// No groups matched → True
					returnDataTrue.push(outputItem);
				} else {
					// Group matched, check THEN condition
					if (thenConditionPassed) {
						// Group matched AND THEN condition passed → True
						returnDataTrue.push(outputItem);
					} else {
						// Group matched BUT THEN condition failed → False
						returnDataFalse.push(outputItem);
					}
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

