export const isNullOrUndefined = (value: any, message: string = 'Value is null or undefined') => {
    if(value == null || value == undefined){
        throw new Error(message);
    }
}