import * as react_jsx_runtime from 'react/jsx-runtime';

type FilterType = "text" | "date" | "datetime" | "List" | "lov";
interface SelectOption {
    text: string;
    value: any;
}
interface FilterDefinition {
    displaytext: string;
    ModelName: string;
    DataType: FilterType;
    value?: string;
    ListOption?: SelectOption[];
    expectedKeys?: string[];
    LovService?: () => Promise<any>;
}
interface SubmitObject {
    filters: Record<string, string>;
}
interface SearchBarProps {
    filterDefinitions: FilterDefinition[];
    onSubmit: (submitObject: SubmitObject) => void;
}
declare const SearchBar: ({ filterDefinitions, onSubmit }: SearchBarProps) => react_jsx_runtime.JSX.Element;

export { SearchBar as default };
