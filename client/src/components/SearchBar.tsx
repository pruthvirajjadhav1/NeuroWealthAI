import { useState } from "react";
import { Input } from "./ui/input"

const SearchBar = ({ onSearch }: { onSearch: (query: string) => void }) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        onSearch(e.target.value);
    };
    return (
        <div className="space-y-2 py-6 ">
            <div className="flex items-center space-x-2">
                <div className="relative flex items-center w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center pl-3 text-[#8F8F8F]">
                        <MagnifyingGlassIcon />
                    </div>
                    <Input
                        id="input-25"
                        className="pl-12 pr-12 border dark:bg-[#212A39] rounded-xl border-[#2D2D2D] font-normal hover:border-2 hover:transition-all placeholder:text-[#6B6B6B]"
                        placeholder="Search Projects..."
                        type="search"
                        value={inputValue}
                        onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 end-0 flex items-center pr-3 text-[#8F8F8F] ">
                        <kbd className="inline-flex h-5 max-h-full items-center rounded border border-[#2D2D2D] px-1 font-[inherit] text-[0.625rem] font-medium text-[#8F8F8F]">
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>
        </div>

    )
}

export default SearchBar

export function MagnifyingGlassIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>

    )
}