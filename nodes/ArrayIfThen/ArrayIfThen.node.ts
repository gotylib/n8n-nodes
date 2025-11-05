import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class ArrayIfThen implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Array If-Then',
		name: 'arrayIfThen',
		icon: { light: 'file:arrayIfThen.svg', dark: 'file:arrayIfThen.dark.svg' },
		group: ['transform'],
		version: 1,
		description: 'Apply conditional transformations to array elements based on if-then rules',
		defaults: {
			name: 'Array If-Then',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Array Path',
				name: 'arrayPath',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g., body.RegisterRecord or {{$json.body.RegisterRecord}}',
				description:
					'Path to the array in the JSON data. Use dot notation (e.g., body.array) or expression (e.g., {{$json.body.array}})',
			},
			{
				displayName: 'If-Then Rules',
				name: 'ifThenRules',
				type: 'collection',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add If-Then Rule',
				},
				default: {},
				placeholder: 'Add If-Then Rule',
				description: 'Rules to apply: if condition is met, then perform action',
				options: [
					{
						displayName: 'If Condition',
						name: 'ifCondition',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Condition',
								name: 'condition',
								values: [
									{
										displayName: 'Field Path',
										name: 'fieldPath',
										type: 'string',
										default: '',
										placeholder: 'e.g., recordId or CounterpartyInfo.CounterpartyType',
										description:
											'Path to the field to check in each array element. Use dot notation or direct field name',
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
										placeholder: 'e.g., 1',
										description: 'Value to compare against (supports expressions)',
									},
								],
							},
						],
						description: 'Condition to check for each array element',
					},
					{
						displayName: 'Then Action',
						name: 'thenAction',
						type: 'fixedCollection',
						default: {},
						options: [
							{
								displayName: 'Action',
								name: 'action',
								values: [
									{
										displayName: 'Target Field',
										name: 'targetField',
										type: 'string',
										default: '',
										placeholder: 'e.g., docid.id or result',
										description:
											'Field path where to store the result. Use dot notation to create nested objects',
									},
									{
										displayName: 'Expression',
										name: 'expression',
										type: 'string',
										typeOptions: {
											rows: 3,
										},
										default: '',
										placeholder:
											'e.g., {{ $item.docid.id * $item.ContractNumber }} or {{ $item.field1 + $item.field2 }}',
										description:
											'Expression to evaluate. Use $item to reference current array element. Supports operations like +, -, *, /, etc.',
									},
								],
							},
						],
						description: 'Action to perform when condition is met',
					},
				],
			},
			{
				displayName: 'Else Action',
				name: 'elseAction',
				type: 'fixedCollection',
				default: {},
				options: [
					{
						displayName: 'Action',
						name: 'action',
						values: [
							{
								displayName: 'Target Field',
								name: 'targetField',
								type: 'string',
								default: '',
								placeholder: 'e.g., docid.id or result',
								description:
									'Field path where to store the result when no conditions match. Use dot notation to create nested objects',
							},
							{
								displayName: 'Expression',
								name: 'expression',
								type: 'string',
								typeOptions: {
									rows: 3,
								},
								default: '',
								placeholder:
									'e.g., {{ $item.field1 }} or {{ 0 }}',
								description:
									'Expression to evaluate when no conditions match. Use $item to reference current array element.',
							},
						],
					},
				],
				description: 'Optional action to perform when no conditions match',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

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

		// Helper function to set field value in object using dot notation
		const setFieldValue = (obj: any, fieldPath: string, value: any): void => {
			if (!fieldPath) {
				return;
			}
			const pathParts = fieldPath.split('.');
			let current = obj;
			for (let i = 0; i < pathParts.length - 1; i++) {
				const part = pathParts[i];
				if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
					current[part] = {};
				}
				current = current[part];
			}
			current[pathParts[pathParts.length - 1]] = value;
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
			return resolved;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const arrayPathParam = this.getNodeParameter('arrayPath', itemIndex, '') as any;
				const ifThenRulesCollection = this.getNodeParameter('ifThenRules', itemIndex, {}) as any;
				const elseActionCollection = this.getNodeParameter('elseAction', itemIndex, {}) as any;
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

				// Parse if-then rules
				const rules: Array<{
					ifCondition: {
						fieldPath: string;
						operation: string;
						value: any;
					};
					thenAction: {
						targetField: string;
						expression: string;
					};
				}> = [];

				if (ifThenRulesCollection && typeof ifThenRulesCollection === 'object') {
					if (Array.isArray(ifThenRulesCollection)) {
						for (const rule of ifThenRulesCollection) {
							if (rule && typeof rule === 'object') {
								const ifCondition = rule.ifCondition;
								const thenAction = rule.thenAction;

								if (
									ifCondition &&
									typeof ifCondition === 'object' &&
									ifCondition.condition &&
									Array.isArray(ifCondition.condition) &&
									ifCondition.condition.length > 0
								) {
									const condition = ifCondition.condition[0];
									if (
										thenAction &&
										typeof thenAction === 'object' &&
										thenAction.action &&
										Array.isArray(thenAction.action) &&
										thenAction.action.length > 0
									) {
										const action = thenAction.action[0];
										const fieldPath = condition.fieldPath;
										if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
											rules.push({
												ifCondition: {
													fieldPath: String(fieldPath),
													operation: (condition.operation as string) || 'equal',
													value: condition.value,
												},
												thenAction: {
													targetField: String(action.targetField || ''),
													expression: String(action.expression || ''),
												},
											});
										}
									}
								}
							}
						}
					} else {
						// Fallback: convert object with numbered keys
						const keys = Object.keys(ifThenRulesCollection).sort();
						for (const key of keys) {
							const rule = ifThenRulesCollection[key];
							if (rule && typeof rule === 'object') {
								const ifCondition = rule.ifCondition;
								const thenAction = rule.thenAction;

								if (
									ifCondition &&
									typeof ifCondition === 'object' &&
									ifCondition.condition &&
									Array.isArray(ifCondition.condition) &&
									ifCondition.condition.length > 0
								) {
									const condition = ifCondition.condition[0];
									if (
										thenAction &&
										typeof thenAction === 'object' &&
										thenAction.action &&
										Array.isArray(thenAction.action) &&
										thenAction.action.length > 0
									) {
										const action = thenAction.action[0];
										const fieldPath = condition.fieldPath;
										if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
											rules.push({
												ifCondition: {
													fieldPath: String(fieldPath),
													operation: (condition.operation as string) || 'equal',
													value: condition.value,
												},
												thenAction: {
													targetField: String(action.targetField || ''),
													expression: String(action.expression || ''),
												},
											});
										}
									}
								}
							}
						}
					}
				}

				// Parse else action
				let elseAction: { targetField: string; expression: string } | null = null;
				if (elseActionCollection && typeof elseActionCollection === 'object') {
					const action = elseActionCollection.action;
					if (action && Array.isArray(action) && action.length > 0) {
						const actionData = action[0];
						if (actionData.targetField && actionData.expression) {
							elseAction = {
								targetField: String(actionData.targetField),
								expression: String(actionData.expression),
							};
						}
					}
				}

				// Process each array element
				const processedArray = array.map((arrayItem, arrayIndex) => {
					// Create a copy of the array item to avoid modifying original
					const processedItem = JSON.parse(JSON.stringify(arrayItem));
					let matched = false;

					// Check each rule
					for (const rule of rules) {
						const resolvedFieldPath = resolveFieldPath(rule.ifCondition.fieldPath);
						const fieldValue = getFieldValue(arrayItem, resolvedFieldPath);
						let compareValue: any = null;

						if (
							rule.ifCondition.operation !== 'exists' &&
							rule.ifCondition.operation !== 'notExists'
						) {
							compareValue = rule.ifCondition.value;
						}

						const conditionResult = performComparison(
							fieldValue,
							rule.ifCondition.operation,
							compareValue,
						);

						if (conditionResult) {
							matched = true;
							// Evaluate expression with $item context
							let result: any = rule.thenAction.expression;

							// If expression contains {{ }}, try to evaluate it
							if (typeof result === 'string' && result.includes('{{')) {
								try {
									// Replace $item references with actual values
									// Simple expression evaluation - replace $item.field with actual values
									let expression = result;
									// Replace $item.fieldName with actual values
									const itemRegex = /\{\{\s*\$item\.([\w.]+)\s*\}\}/g;
									expression = expression.replace(itemRegex, (match, path) => {
										const value = getFieldValue(arrayItem, path);
										return value !== undefined ? JSON.stringify(value) : 'undefined';
									});

									// Replace $item.fieldName in operations (without {{ }})
									expression = expression.replace(/\$item\.([\w.]+)/g, (match, path) => {
										const value = getFieldValue(arrayItem, path);
										return value !== undefined ? JSON.stringify(value) : 'undefined';
									});

									// Try to evaluate the expression
									// Extract the expression part (between {{ }})
									const exprMatch = expression.match(/\{\{\s*(.+?)\s*\}\}/);
									if (exprMatch) {
										const expr = exprMatch[1].trim();
										
										// Replace $item.field with actual values from arrayItem
										// This allows expressions like: $item.docid.id * $item.ContractNumber
										let evalExpr = expr;
										
										// Replace all $item.fieldName references
										const itemRefRegex = /\$item\.([\w.]+)/g;
										evalExpr = evalExpr.replace(itemRefRegex, (match, path) => {
											const value = getFieldValue(arrayItem, path);
											if (value === undefined || value === null) {
												return 'undefined';
											}
											// If it's a number, return as number
											if (typeof value === 'number') {
												return String(value);
											}
											// If it's a boolean, return as boolean
											if (typeof value === 'boolean') {
												return String(value);
											}
											// Otherwise, return as JSON string (will be parsed)
											return JSON.stringify(value);
										});

										// Replace JSON stringified numbers and booleans back to actual values
										evalExpr = evalExpr.replace(/"(-?\d+\.?\d*)"/g, (match, num) => {
											return num; // Remove quotes from numbers
										});
										evalExpr = evalExpr.replace(/"true"/g, 'true');
										evalExpr = evalExpr.replace(/"false"/g, 'false');
										evalExpr = evalExpr.replace(/"null"/g, 'null');

										try {
											// Use Function constructor for safer evaluation
											// This allows expressions like: docid.id * ContractNumber
											const func = new Function(`return ${evalExpr}`);
											result = func();
										} catch (evalError) {
											// If evaluation fails, keep the original expression
											// It will be evaluated by n8n in subsequent nodes
											result = rule.thenAction.expression;
										}
									} else {
										// If no {{ }}, just use the expression as-is
										result = expression;
									}
								} catch (error) {
									// If evaluation fails, keep the expression as-is
									result = rule.thenAction.expression;
								}
							}

							// Set the result in the target field
							if (rule.thenAction.targetField) {
								setFieldValue(processedItem, rule.thenAction.targetField, result);
							}

							// Only process first matching rule
							break;
						}
					}

					// If no rule matched and else action is defined
					if (!matched && elseAction) {
						let result: any = elseAction.expression;

						// If expression contains {{ }}, try to evaluate it
						if (typeof result === 'string' && result.includes('{{')) {
							try {
								// Replace $item references with actual values
								let expression = result;
								const itemRegex = /\{\{\s*\$item\.([\w.]+)\s*\}\}/g;
								expression = expression.replace(itemRegex, (match, path) => {
									const value = getFieldValue(arrayItem, path);
									return value !== undefined ? JSON.stringify(value) : 'undefined';
								});

								expression = expression.replace(/\$item\.([\w.]+)/g, (match, path) => {
									const value = getFieldValue(arrayItem, path);
									return value !== undefined ? JSON.stringify(value) : 'undefined';
								});

								const exprMatch = expression.match(/\{\{\s*(.+?)\s*\}\}/);
								if (exprMatch) {
									const expr = exprMatch[1].trim();
									
									// Replace $item.field with actual values
									let evalExpr = expr;
									const itemRefRegex = /\$item\.([\w.]+)/g;
									evalExpr = evalExpr.replace(itemRefRegex, (match, path) => {
										const value = getFieldValue(arrayItem, path);
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

									// Replace JSON stringified values back
									evalExpr = evalExpr.replace(/"(-?\d+\.?\d*)"/g, (match, num) => num);
									evalExpr = evalExpr.replace(/"true"/g, 'true');
									evalExpr = evalExpr.replace(/"false"/g, 'false');
									evalExpr = evalExpr.replace(/"null"/g, 'null');

									try {
										const func = new Function(`return ${evalExpr}`);
										result = func();
									} catch (evalError) {
										result = elseAction.expression;
									}
								} else {
									result = expression;
								}
							} catch (error) {
								result = elseAction.expression;
							}
						}

						// Set the result in the target field
						if (elseAction.targetField) {
							setFieldValue(processedItem, elseAction.targetField, result);
						}
					}

					return processedItem;
				});

				// Update the original array in the item
				const pathToUse = String(arrayPathParam);
				const pathParts = pathToUse.replace(/^\$json\./, '').split('.');
				let target: any = item.json;
				for (let i = 0; i < pathParts.length - 1; i++) {
					const part = pathParts[i];
					if (target && typeof target === 'object' && part in target) {
						target = target[part];
					}
				}
				if (target && typeof target === 'object') {
					target[pathParts[pathParts.length - 1]] = processedArray;
				}

				// Add metadata
				const outputItem: INodeExecutionData = {
					json: {
						...item.json,
						_arrayIfThen: {
							processedElements: processedArray.length,
							rulesApplied: rules.length,
							hasElseAction: elseAction !== null,
						},
					},
					pairedItem: { item: itemIndex },
				};

				returnData.push(outputItem);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
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

		return [returnData];
	}
}

