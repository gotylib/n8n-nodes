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
		description:
			'Apply conditional transformations to array elements based on if-then rules. Supports referencing header data using $header.[0] syntax in conditions and expressions.',
		defaults: {
			name: 'Array If-Then',
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
				placeholder: 'e.g., body.RegisterRecord or {{$json.body.RegisterRecord}}',
				description:
					'Path to the array in the JSON data. Use dot notation (e.g., body.array) or expression (e.g., {{$json.body.array}})',
			},
			{
				displayName: 'Header Path (Optional)',
				name: 'headerPath',
				type: 'string',
				default: '',
				required: false,
				placeholder: 'e.g., body.header or {{$json.body.header}}',
				description:
					'Optional path to header data. If provided, you can reference header fields in conditions using $header.[0] or $header.field syntax',
			},
			{
				displayName: 'Check Mode',
				name: 'checkMode',
				type: 'options',
				options: [
					{
						name: 'All Elements Must Match',
						value: 'all',
						description: 'All array elements must match at least one rule (AND)',
					},
					{
						name: 'At Least One Element Must Match',
						value: 'any',
						description: 'At least one array element must match at least one rule (OR)',
					},
				],
				default: 'all',
				description: 'How to check across array elements',
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
						description: 'How to combine multiple conditions in this rule',
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
						description: 'Conditions to check for each array element',
						options: [
							{
								displayName: 'Field Path',
								name: 'fieldPath',
								type: 'string',
								default: '',
								placeholder: 'e.g., [0] or $header.[12] or $header.12 or recordId or CounterpartyInfo.CounterpartyType',
								description:
									'Path to the field. For arrays use [0], [1]. Use $header.[12] (array) or $header.12 (object key) to reference header data. Use dot notation for objects (e.g., field.subfield)',
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
										placeholder: 'e.g., [7] or field.subfield',
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
										placeholder: 'e.g., [7] or docid.id or result',
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
		debugger;
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

		// Helper function to get field value from array item or header
		// Supports both object paths (field.subfield) and array indices ([0], [1])
		// Supports $header.[0] syntax to reference header data
		// Supports both $header.[12] (array) and $header.12 (object key) syntax
		const getFieldValue = (arrayItem: any, fieldPath: string, headerData?: any): any => {
			if (!fieldPath) {
				return arrayItem;
			}

			// Check if this is a header reference
			if (fieldPath.startsWith('$header.')) {
				if (!headerData) {
					return undefined;
				}
				const headerPath = fieldPath.substring(8); // Remove '$header.' prefix
				
				// Handle direct numeric key access like $header.2 or $header.[2]
				if (headerPath === '' || headerPath.trim() === '') {
					return headerData; // Return whole header if no path specified
				}
				
				return getFieldValue(headerData, headerPath);
			}

			// Handle array indices like [0], [1], etc.
			if (fieldPath.startsWith('[') && fieldPath.endsWith(']')) {
				const index = parseInt(fieldPath.slice(1, -1), 10);
				if (!isNaN(index)) {
					// Try as array first
					if (Array.isArray(arrayItem)) {
						return arrayItem[index];
					}
					// If not array, try as object key (string or number)
					if (arrayItem && typeof arrayItem === 'object') {
						// Try as string key
						if (String(index) in arrayItem) {
							return arrayItem[String(index)];
						}
						// Try as number key
						if (index in arrayItem) {
							return arrayItem[index];
						}
					}
				}
				return undefined;
			}

			// Handle dot notation for objects
			const pathParts = fieldPath.split('.');
			let value = arrayItem;

			for (let i = 0; i < pathParts.length; i++) {
				const part = pathParts[i];

				// Check if part is an array index like [0]
				if (part.startsWith('[') && part.endsWith(']')) {
					const index = parseInt(part.slice(1, -1), 10);
					if (!isNaN(index)) {
						// Try as array first
						if (Array.isArray(value)) {
							value = value[index];
						} 
						// If not array, try as object key
						else if (value && typeof value === 'object') {
							// Try as string key first (e.g., "12")
							if (String(index) in value) {
								value = value[String(index)];
							}
							// Try as number key (e.g., 12)
							else if (index in value) {
								value = value[index];
							} else {
								return undefined;
							}
						} else {
							return undefined;
						}
					} else {
						return undefined;
					}
				} else if (value && typeof value === 'object') {
					// Try as regular property first
					if (part in value) {
						value = value[part];
					}
					// If not found and part is numeric, try as numeric key
					else if (/^\d+$/.test(part)) {
						const numKey = parseInt(part, 10);
						// Try as string key (e.g., "12")
						if (String(numKey) in value) {
							value = value[String(numKey)];
						}
						// Try as number key (e.g., 12)
						else if (numKey in value) {
							value = value[numKey];
						} else {
							return undefined;
						}
					} else {
						return undefined;
					}
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

			// Handle array indices like [0], [1], etc.
			if (fieldPath.startsWith('[') && fieldPath.endsWith(']')) {
				const index = parseInt(fieldPath.slice(1, -1), 10);
				if (!isNaN(index) && Array.isArray(obj)) {
					obj[index] = value;
				}
				return;
			}

			const pathParts = fieldPath.split('.');
			let current = obj;
			for (let i = 0; i < pathParts.length - 1; i++) {
				const part = pathParts[i];

				// Check if part is an array index like [0]
				if (part.startsWith('[') && part.endsWith(']')) {
					const index = parseInt(part.slice(1, -1), 10);
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

			const lastPart = pathParts[pathParts.length - 1];
			if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
				const index = parseInt(lastPart.slice(1, -1), 10);
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
		// Supports array indices like [0], [1], etc.
		// Supports $header.[0] syntax to reference header data
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
				} else if (resolved.startsWith('$header.')) {
					// Keep $header. prefix for header references
					// resolved stays as is
				}
			}
			// Handle {{ }} expression syntax
			if (resolved.startsWith('{{') && resolved.endsWith('}}')) {
				resolved = resolved.slice(2, -2).trim();
				// Check for header references BEFORE removing $json. prefix
				if (resolved.includes('header[') || resolved.includes('header.[')) {
					// Extract header index from pattern like $json.body.header[2] or header[2]
					const headerMatch = resolved.match(/header\[(\d+)\]/);
					if (headerMatch) {
						resolved = `$header.[${headerMatch[1]}]`;
					} else {
						// Keep $header. prefix if already present
						if (resolved.startsWith('$header.')) {
							// resolved stays as is
						} else if (resolved.startsWith('$json.')) {
							resolved = resolved.substring(6);
						} else if (resolved.startsWith('$item.')) {
							resolved = resolved.substring(6);
						}
					}
				} else {
					if (resolved.startsWith('$json.')) {
						resolved = resolved.substring(6);
					} else if (resolved.startsWith('$item.')) {
						resolved = resolved.substring(6);
					} else if (resolved.startsWith('$header.')) {
						// Keep $header. prefix for header references
						// resolved stays as is
					}
				}
			}
			// Trim whitespace and normalize array indices (remove spaces inside brackets)
			resolved = resolved.trim();
			// Normalize [ 2 ] to [2] but preserve $header. prefix
			if (resolved.startsWith('$header.')) {
				const headerPrefix = '$header.';
				const headerPath = resolved.substring(headerPrefix.length);
				const normalizedPath = headerPath.replace(/\s*\[\s*(\d+)\s*\]\s*/g, '[$1]');
				resolved = headerPrefix + normalizedPath;
			} else {
				resolved = resolved.replace(/\s*\[\s*(\d+)\s*\]\s*/g, '[$1]');
			}
			return resolved;
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const arrayPathParam = this.getNodeParameter('arrayPath', itemIndex, '') as any;
				const checkMode = this.getNodeParameter('checkMode', itemIndex, 'all') as string;
				const ifThenRulesCollection = this.getNodeParameter('ifThenRules', itemIndex, {}) as any;
				const elseActionCollection = this.getNodeParameter('elseAction', itemIndex, {}) as any;
				const item = items[itemIndex];

				// Resolve header path (optional)
				let headerData: any = undefined;
				const headerPathParam = this.getNodeParameter('headerPath', itemIndex, '') as any;
				// eslint-disable-next-line no-console
				console.log('[DEBUG ArrayIfThen] HeaderPathParam:', headerPathParam);
				// eslint-disable-next-line no-console
				console.log('[DEBUG ArrayIfThen] Item.json keys:', Object.keys(item.json));
				
				if (headerPathParam && String(headerPathParam).trim() !== '') {
					if (Array.isArray(headerPathParam)) {
						headerData = headerPathParam[0]; // Take first element if array
					} else {
						const pathToUse = String(headerPathParam);
						// Handle both = prefix and full expressions
						const cleanPath = pathToUse.replace(/^=/, '').replace(/^\$json\./, '');
						// eslint-disable-next-line no-console
						console.log('[DEBUG ArrayIfThen] Clean path:', cleanPath);
						const pathParts = cleanPath.split('.');
						let value: any = item.json;
						for (const part of pathParts) {
							// eslint-disable-next-line no-console
							console.log('[DEBUG ArrayIfThen] Resolving path part:', part, 'from:', value);
							if (value && typeof value === 'object' && part in value) {
								value = value[part];
							} else {
								// Header path is optional, so don't throw error if not found
								// eslint-disable-next-line no-console
								console.log('[DEBUG ArrayIfThen] Path part not found:', part);
								headerData = undefined;
								break;
							}
						}
						headerData = value;
						// eslint-disable-next-line no-console
						console.log('[DEBUG ArrayIfThen] Resolved headerData:', headerData);
					}
				}

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

				// Parse if-then rules with new structure
				const rules: Array<{
					conditions: Array<{
						fieldPath: string;
						operation: string;
						value: any;
						value2?: any;
					}>;
					combineConditions: string;
					thenAction: {
						checkCondition: boolean;
						conditionFieldPath?: string;
						conditionOperation?: string;
						conditionValue?: any;
						targetField: string;
						expression: string;
					};
				}> = [];

				if (ifThenRulesCollection && typeof ifThenRulesCollection === 'object') {
					if (Array.isArray(ifThenRulesCollection)) {
						for (const rule of ifThenRulesCollection) {
							if (rule && typeof rule === 'object') {
								const conditionsCollection = rule.conditions;
								const combineConditions = rule.combineConditions || 'and';
								const thenAction = rule.thenAction;

								// Parse conditions
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
												if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
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
										// Fallback: convert object with numbered keys
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
														value2: condition.value2,
													});
												}
											}
										}
									}
								}

								// Parse then action
								if (thenAction && typeof thenAction === 'object' && thenAction.action) {
									const actionArray = Array.isArray(thenAction.action) ? thenAction.action : [thenAction.action];
									if (actionArray.length > 0) {
										const action = actionArray[0];
										if (conditions.length > 0) {
											rules.push({
												conditions,
												combineConditions: String(combineConditions),
												thenAction: {
													checkCondition: Boolean(action.checkCondition),
													conditionFieldPath: action.checkCondition ? String(action.conditionFieldPath || '') : undefined,
													conditionOperation: action.checkCondition ? (String(action.conditionOperation || 'isNotEmpty')) : undefined,
													conditionValue: action.checkCondition ? action.conditionValue : undefined,
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
								const conditionsCollection = rule.conditions;
								const combineConditions = rule.combineConditions || 'and';
								const thenAction = rule.thenAction;

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
												if (fieldPath !== undefined && fieldPath !== null && String(fieldPath).trim() !== '') {
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

								if (thenAction && typeof thenAction === 'object' && thenAction.action) {
									const actionArray = Array.isArray(thenAction.action) ? thenAction.action : [thenAction.action];
									if (actionArray.length > 0) {
										const action = actionArray[0];
										if (conditions.length > 0) {
											rules.push({
												conditions,
												combineConditions: String(combineConditions),
												thenAction: {
													checkCondition: Boolean(action.checkCondition),
													conditionFieldPath: action.checkCondition ? String(action.conditionFieldPath || '') : undefined,
													conditionOperation: action.checkCondition ? (String(action.conditionOperation || 'isNotEmpty')) : undefined,
													conditionValue: action.checkCondition ? action.conditionValue : undefined,
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
				// Track which elements match the conditions
				const elementMatches: boolean[] = [];
				const processedArray = array.map((arrayItem, arrayIndex) => {
					// Create a copy of the array item to avoid modifying original
					const processedItem = JSON.parse(JSON.stringify(arrayItem));
					let matched = false;

					// Check each rule
					for (const rule of rules) {
						// Check all conditions in this rule
						const conditionResults: boolean[] = [];

						for (const condition of rule.conditions) {
							let fieldPathToResolve = condition.fieldPath;
							
							// Check if expression contains header reference like {{ $json.body.header[2] }}
							// Convert it to $header.[2] syntax
							if (typeof fieldPathToResolve === 'string') {
								// Check for patterns that indicate header reference
								// Pattern: header[2] or body.header[2] or $json.body.header[2]
								const headerPatterns = [
									/\{\{\s*\$json\.body\.header\[(\d+)\]\s*\}\}/, // {{ $json.body.header[2] }}
									/\{\{\s*\$json\.header\[(\d+)\]\s*\}\}/,      // {{ $json.header[2] }}
									/\$json\.body\.header\[(\d+)\]/,              // $json.body.header[2]
									/\$json\.header\[(\d+)\]/,                     // $json.header[2]
									/body\.header\[(\d+)\]/,                       // body.header[2]
									/header\[(\d+)\]/,                             // header[2]
								];
								
								for (const pattern of headerPatterns) {
									const match = fieldPathToResolve.match(pattern);
									if (match) {
										fieldPathToResolve = `$header.[${match[1]}]`;
										break;
									}
								}
							}
							
							const resolvedFieldPath = resolveFieldPath(fieldPathToResolve);
							const fieldValue = getFieldValue(arrayItem, resolvedFieldPath, headerData);
							
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
							
							// eslint-disable-next-line no-console
							console.log('[DEBUG ArrayIfThen] Condition result:', conditionResult);

							conditionResults.push(conditionResult);
						}

						// Combine condition results based on combineConditions
						let ruleMatches: boolean;
						if (rule.combineConditions === 'and') {
							ruleMatches = conditionResults.every((r) => r === true);
						} else {
							ruleMatches = conditionResults.some((r) => r === true);
						}

						if (ruleMatches) {
							// Check if there's a condition to check before performing the action
							let shouldPerformAction = true;
							
							if (rule.thenAction.checkCondition) {
								const conditionFieldPath = rule.thenAction.conditionFieldPath;
								const conditionOperation = rule.thenAction.conditionOperation;
								const conditionValue = rule.thenAction.conditionValue;

								if (conditionFieldPath && conditionOperation) {
									const resolvedConditionFieldPath = resolveFieldPath(conditionFieldPath);
									const conditionFieldValue = getFieldValue(arrayItem, resolvedConditionFieldPath, headerData);
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
								}
							}

							if (shouldPerformAction) {
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
											const value = getFieldValue(arrayItem, path, headerData);
											return value !== undefined ? JSON.stringify(value) : 'undefined';
										});

										// Replace $header.fieldName or $header.[0] with actual values
										const headerRegex = /\{\{\s*\$header\.([\w.\[\]]+)\s*\}\}/g;
										expression = expression.replace(headerRegex, (match, path) => {
											const value = getFieldValue(headerData, `$header.${path}`, headerData);
											return value !== undefined ? JSON.stringify(value) : 'undefined';
										});

										// Replace $item.fieldName in operations (without {{ }})
										expression = expression.replace(/\$item\.([\w.]+)/g, (match, path) => {
											const value = getFieldValue(arrayItem, path, headerData);
											return value !== undefined ? JSON.stringify(value) : 'undefined';
										});

										// Replace $header.fieldName or $header.[0] in operations (without {{ }})
										expression = expression.replace(/\$header\.([\w.\[\]]+)/g, (match, path) => {
											const value = getFieldValue(headerData, `$header.${path}`, headerData);
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
												const value = getFieldValue(arrayItem, path, headerData);
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

											// Replace all $header.fieldName or $header.[0] references
											const headerRefRegex = /\$header\.([\w.\[\]]+)/g;
											evalExpr = evalExpr.replace(headerRefRegex, (match, path) => {
												const value = getFieldValue(headerData, `$header.${path}`, headerData);
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
					}

					// If no rule matched and else action is defined
					if (!matched && elseAction) {
						matched = true; // Mark as matched even if no rule matched, but else action was applied
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

					// Track if this element matched
					elementMatches.push(matched);

					return { processedItem, matched };
				});

				// Determine final result based on check mode
				// First, identify which elements match IF conditions (regardless of THEN check)
				const elementsMatchingIf: boolean[] = [];
				for (let i = 0; i < array.length; i++) {
					const arrayItem = array[i];
					let matchesIf = false;
					
					for (const rule of rules) {
						const conditionResults: boolean[] = [];
						for (const condition of rule.conditions) {
							let fieldPathToResolve = condition.fieldPath;
							
							// Check if expression contains header reference like {{ $json.body.header[2] }}
							// Convert it to $header.[2] syntax
							if (typeof fieldPathToResolve === 'string') {
								// Check for patterns that indicate header reference
								// Pattern: header[2] or body.header[2] or $json.body.header[2]
								const headerPatterns = [
									/\{\{\s*\$json\.body\.header\[(\d+)\]\s*\}\}/, // {{ $json.body.header[2] }}
									/\{\{\s*\$json\.header\[(\d+)\]\s*\}\}/,      // {{ $json.header[2] }}
									/\$json\.body\.header\[(\d+)\]/,              // $json.body.header[2]
									/\$json\.header\[(\d+)\]/,                     // $json.header[2]
									/body\.header\[(\d+)\]/,                       // body.header[2]
									/header\[(\d+)\]/,                             // header[2]
								];
								
								for (const pattern of headerPatterns) {
									const match = fieldPathToResolve.match(pattern);
									if (match) {
										fieldPathToResolve = `$header.[${match[1]}]`;
										break;
									}
								}
							}
							
							const resolvedFieldPath = resolveFieldPath(fieldPathToResolve);
							const fieldValue = getFieldValue(arrayItem, resolvedFieldPath, headerData);
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
						
						let ruleMatchesIf: boolean;
						if (rule.combineConditions === 'and') {
							ruleMatchesIf = conditionResults.every((r) => r === true);
						} else {
							ruleMatchesIf = conditionResults.some((r) => r === true);
						}
						
						if (ruleMatchesIf) {
							matchesIf = true;
							break;
						}
					}
					
					elementsMatchingIf.push(matchesIf);
				}
				
				// Check if there are any elements matching IF conditions
				const hasElementsMatchingIf = elementsMatchingIf.some(m => m === true);
				
				let hasMatch: boolean;
				if (checkMode === 'all') {
					// All elements that match IF conditions must also pass THEN condition check
					// If no elements match IF, result is false
					if (!hasElementsMatchingIf) {
						hasMatch = false;
					} else {
						// Check if all elements matching IF also match (pass THEN)
						hasMatch = true;
						for (let i = 0; i < elementsMatchingIf.length; i++) {
							if (elementsMatchingIf[i] && !elementMatches[i]) {
								// This element matches IF but doesn't match full rule (THEN failed)
								hasMatch = false;
								break;
							}
						}
					}
				} else {
					// At least one element that matches IF conditions must also pass THEN condition check
					// If no elements match IF, result is false
					if (!hasElementsMatchingIf) {
						hasMatch = false;
					} else {
						// Check if at least one element matching IF also matches (passes THEN)
						hasMatch = false;
						for (let i = 0; i < elementsMatchingIf.length; i++) {
							if (elementsMatchingIf[i] && elementMatches[i]) {
								// This element matches both IF and THEN
								hasMatch = true;
								break;
							}
						}
					}
				}

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
					// Update array with processed items
					target[pathParts[pathParts.length - 1]] = processedArray.map((p: any) => p.processedItem);
				}

				// Add metadata
				const outputItem: INodeExecutionData = {
					json: {
						...item.json,
						_arrayIfThen: {
							matched: hasMatch,
							processedElements: processedArray.length,
							matchedElements: processedArray.filter((p: any) => p.matched).length,
							rulesApplied: rules.length,
							hasElseAction: elseAction !== null,
						},
					},
					pairedItem: { item: itemIndex },
				};

				// Route to True or False output
				if (hasMatch) {
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


