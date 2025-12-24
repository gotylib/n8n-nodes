import type {
	EngineResponse,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOutput,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

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
                    displayName: 'Condition',
                    name: 'condition',
                    type: 'string',
                    default: '',
                },
            ],
        };

		async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>  {
			const item = this.getInputData();
			return [item];
		}
    }