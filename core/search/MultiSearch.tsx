/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
  } from "react";
  import { Search, X, Filter, Calendar } from "lucide-react";
  // import styles from "./LiveSearch.module.css";
  import styled, { keyframes } from "styled-components";
  
  type FilterType = "text" | "date" | "datetime" | "List" | "lov";
  
  interface SelectOption {
    text: string;
    value: any;
  }
  
  export interface FilterDefinition {
    displaytext: string;
    ModelName: string;
    DataType: FilterType;
    value?: string;
    ListOption?: SelectOption[];
    expectedKeys?: string[];
    LovService?: () => Promise<any>;
  }
  
  export interface SubmitObject {
    filters: Record<string, string>;
  }
  
  interface SearchBarProps {
    filterDefinitions: FilterDefinition[];
    onSubmit: (submitObject: SubmitObject) => void;
  }
  
  const SearchBar = ({ filterDefinitions, onSubmit }: SearchBarProps) => {
    const [query, setQuery] = useState<string>("");
    const [activeFilters, setActiveFilters] = useState<FilterDefinition[]>([]);
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showLOVModal, setShowLOVModal] = useState(false);
    const [lovData, setLovData] = useState<any[]>([]);
    const [lovquery, setlovquery] = useState("");
    const [currentLOVFilter, setCurrentLOVFilter] =
      useState<FilterDefinition | null>(null);
    const [focusedFilterIndex, setFocusedFilterIndex] = useState<number | null>(
      null
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);
  
    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (
        filtersRef.current &&
        !filtersRef.current.contains(event.target as Node)
      ) {
        setShowFilters(false);
      }
    }, []);
  
    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [handleClickOutside]);
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      if (e.target.value.endsWith(" ")) {
        setShowFilters(true);
      }
    };
  
    /*
     * Removes a filter from the active filters list.
     */
    const removeFilter = (modelName: string) => {
      setActiveFilters((prev: any[]) =>
        prev.filter(
          (filter: { ModelName: string }) => filter.ModelName !== modelName
        )
      );
    };
  
    const handleInputFocus = () => {
      if (filterDefinitions?.length) {
        setShowFilters(true);
      }
    };
  
    const handleFilterClick = async (filter: FilterDefinition) => {
      const existingFilterIndex = activeFilters.findIndex(
        (f: { ModelName: string }) => f.ModelName === filter.ModelName
      );
      if (existingFilterIndex === -1) {
        if (filter.DataType === "lov" && filter.LovService) {
          try {
            const data = await filter.LovService();
            setLovData(data);
            setCurrentLOVFilter(filter);
            setShowLOVModal(true);
          } catch (error) {
            console.error("Error fetching LOV data:", error);
          }
        } else {
          setActiveFilters([...activeFilters, { ...filter, value: "" }]);
          setFocusedFilterIndex(activeFilters.length);
        }
      }
      setShowFilters(false);
    };
  
    const handleFilterValueChange = (modelName: string, value: string) => {
      setActiveFilters((prev: FilterDefinition[]) =>
        prev.map((filter) =>
          filter.ModelName === modelName ? { ...filter, value } : filter
        )
      );
    };
  
    // const handleSubmit = () => {
    //   const filters: FilterObject[] = activeFilters
    //     .filter((filter) => filter.value !== "")
    //     .map((filter) => ({
    //       ModelName: filter.ModelName,
    //       value: filter.value as string,
    //     }));
  
    //   if (query) {
    //     filters.push({ ModelName: "Query", value: query });
    //   }
  
    //   const submitObject: SubmitObject = { filters };
    //   onSubmit(submitObject);
    //   setShowFilters(false);
    // };
  
    const handleSubmit = () => {
      const filters = activeFilters.reduce(
        (acc: Record<string, string>, filter: FilterDefinition) => {
          if (filter.value) {
            acc[filter.ModelName] = filter.value;
          }
          return acc;
        },
        {} as Record<string, string>
      );
  
      if (query) {
        filters["Query"] = query;
      }
  
      const submitObject: SubmitObject = { filters };
      onSubmit(submitObject);
      setShowFilters(false);
    };
  
    const renderFilterInput = (filter: FilterDefinition, index: number) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const isActive = focusedFilterIndex === index;
      switch (filter.DataType) {
        case "date":
          return (
            <SearchInput
              type="date"
              value={filter.value || ""}
              onChange={(e: { target: { value: string } }) =>
                handleFilterValueChange(filter.ModelName, e.target.value)
              }
              onFocus={() => setFocusedFilterIndex(index)}
            />
          );
        case "List":
          return (
            <SearchSelect
              value={filter.value || ""}
              onChange={(e: { target: { value: string } }) =>
                handleFilterValueChange(filter.ModelName, e.target.value)
              }
              onFocus={() => setFocusedFilterIndex(index)}
            >
              <SearchOption value="">Select...</SearchOption>
              {filter.ListOption?.map((option) => (
                <SearchOption key={option.value} value={option.value}>
                  {option.text}
                </SearchOption>
              ))}
            </SearchSelect>
          );
        case "lov":
          return (
            <SearchInput
              type="text"
              value={filter.value || ""}
              readOnly
              placeholder="Click to select..."
              onClick={() => handleFilterClick(filter)}
              onFocus={() => setFocusedFilterIndex(index)}
            />
          );
        default:
          return (
            <SearchInput
              type="text"
              value={filter.value || ""}
              onChange={(e: { target: { value: string } }) =>
                handleFilterValueChange(filter.ModelName, e.target.value)
              }
              placeholder="Type here..."
              onFocus={() => setFocusedFilterIndex(index)}
            />
          );
      }
    };
  
    const handleLOVRowSelect = (row: any) => {
      if (currentLOVFilter) {
        setActiveFilters([
          ...activeFilters,
          { ...currentLOVFilter, value: `${row.CODE} - ${row.NAME}` },
        ]);
        setShowLOVModal(false);
        setCurrentLOVFilter(null);
        setlovquery("");
      }
    };
  
    const filteredData = useMemo(() => {
      if (!currentLOVFilter || !currentLOVFilter.expectedKeys) {
        return lovData;
      }
      return lovData.filter((row: { [x: string]: any }) =>
        currentLOVFilter.expectedKeys?.some((key: string | number) =>
          String(row[key]).toLowerCase().includes(lovquery.toLowerCase())
        )
      );
    }, [lovData, currentLOVFilter, lovquery]);
  
    return (
      <SearchContainer>
        <SearchInputWrapper>
          <SearchButton onClick={handleSubmit}>
            <Search className="searchIcon" />
          </SearchButton>
          <InputContainer>
            <BadgesContainer>
              {activeFilters.map((filter: FilterDefinition, index: number) => (
                <FilterBadge key={filter.ModelName}>
                  <FilterKey>{filter.displaytext}:</FilterKey>
                  {renderFilterInput(filter, index)}
                  <RemoveFilterButton
                    onClick={() => removeFilter(filter.ModelName)}
                  >
                    <X size={14} />
                  </RemoveFilterButton>
                </FilterBadge>
              ))}
            </BadgesContainer>
            <SearchInput
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onClick={handleInputFocus}
              placeholder="Search..."
            />
          </InputContainer>
        </SearchInputWrapper>
        {showFilters && (
          <FiltersDropdown ref={filtersRef}>
            <FiltersSection>
              <FiltersHeading>Suggested filters</FiltersHeading>
              <FiltersList>
                {filterDefinitions.map((filter) => (
                  <FilterItem
                    key={filter.ModelName}
                    onClick={() => handleFilterClick(filter)}
                  >
                    {filter.DataType === "date" ? (
                      <Calendar size={14} className="filterIcon" />
                    ) : (
                      <Filter size={14} className="filterIcon" />
                    )}
                    {filter.displaytext}
                  </FilterItem>
                ))}
              </FiltersList>
            </FiltersSection>
          </FiltersDropdown>
        )}
        {showLOVModal && currentLOVFilter && (
          <ModalOverlay onClick={() => setShowLOVModal(false)}>
            <ModalContent
              onClick={(e: { stopPropagation: () => any }) => e.stopPropagation()}
            >
              <SearchModalInput
                type="text"
                placeholder="Search..."
                value={lovquery}
                onChange={(e: { target: { value: any } }) =>
                  setlovquery(e.target.value)
                }
              />
              <TableContainer>
                <TableWrapper>
                  <StyledTable>
                    <thead>
                      <tr>
                        {currentLOVFilter.expectedKeys?.map((key: any) => (
                          <TableHeader key={String(key)}>
                            {String(key)}
                          </TableHeader>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(
                        (row: { [x: string]: any }, index: any) => (
                          <TableRow
                            key={index}
                            onClick={() => handleLOVRowSelect(row)}
                          >
                            {currentLOVFilter.expectedKeys?.map(
                              (key: string | number) => (
                                <TableCell key={String(key)}>
                                  {String(row[key])}
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        )
                      )}
                    </tbody>
                  </StyledTable>
                </TableWrapper>
              </TableContainer>
            </ModalContent>
          </ModalOverlay>
        )}
      </SearchContainer>
    );
  };
  
  export default SearchBar;
  
  const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
  `;
  
  const SearchContainer = styled.div`
    position: relative;
    width: 700px;
    margin: 0 auto;
    font-family: var(--font-poppins);
  
    @media (max-width: 640px) {
      max-width: 100%;
    }
  `;
  
  const SearchInputWrapper = styled.div`
    display: flex;
    align-items: center;
    background-color: #f6f8fa;
    border: 1px solid #c9ccd1;
    border-radius: 0.35rem;
    padding: 0.3rem;
    box-shadow: 0 0 0 1px rgba(246, 246, 246, 0.6);
  `;
  
  const SearchButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-right: 0.5rem;
  
    .searchIcon {
      color: #9ca6b7;
    }
  `;
  
  const InputContainer = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
  `;
  
  const BadgesContainer = styled.div`
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scrollbar-color: #99e0f2 transparent;
    max-width: 60%;
    margin-right: 0.5rem;
  
    &::-webkit-scrollbar {
      height: 1px;
    }
  
    &::-webkit-scrollbar-track {
      background: transparent;
    }
  
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
    }
  
    @media (max-width: 640px) {
      max-width: 50%;
    }
  `;
  
  const SearchInput = styled.input`
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--light-input-text-color);
    font-family: var(--font-poppins);
  
    &:focus {
      outline: none;
    }
  
    &::placeholder {
      color: #9ca6b7;
      transition:
        font-size 0.5s ease,
        transform 0.5s ease;
      font-size: 12px;
    }
  
    &:focus::placeholder {
      font-size: 0.5rem;
      transform: translateY(-0.6rem);
      color: #9ca3af6c;
    }
  `;
  
  const SearchSelect = styled.select`
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font-size: 14px;
    color: var(--light-input-text-color);
    font-family: var(--font-poppins);
  
    &:focus {
      outline: none;
    }
  
    &::placeholder {
      color: #9ca6b7;
      transition:
        font-size 0.5s ease,
        transform 0.5s ease;
      font-size: 12px;
    }
  
    &:focus::placeholder {
      font-size: 0.5rem;
      transform: translateY(-0.6rem);
      color: #9ca3af6c;
    }
  `;
  
  const SearchOption = styled.option`
    font-size: 14px;
    border: none;
    border-radius: none;
  `;
  
  const FiltersDropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: white;
    border: 1px solid #c9ccd1;
    border-top: none;
    border-radius: 0 0 0.35rem 0.35rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
  `;
  
  const FiltersSection = styled.div`
    padding: 0.5rem;
  `;
  
  const FiltersHeading = styled.h3`
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 0.5rem;
    color: #4a5568;
  `;
  
  const FiltersList = styled.ul`
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
  `;
  
  const FilterItem = styled.li`
    display: flex;
    align-items: center;
    padding: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    background-color: #f7fafc;
    font-size: 12px;
    border-radius: 0.25rem;
  
    &:hover,
    &.focused {
      background-color: #edf2f7;
    }
  
    .filterIcon {
      margin-right: 0.5rem;
      color: #4a5568;
    }
  `;
  
  const FilterBadge = styled.div`
    display: flex;
    align-items: center;
    background-color: #fcfdff;
    padding: 0.25rem 0.5rem;
    margin-right: 0.5rem;
    font-size: 12px;
    white-space: nowrap;
    cursor: pointer;
  `;
  
  const FilterKey = styled.span`
    font-weight: 600;
    margin-right: 0.25rem;
  `;
  
  const RemoveFilterButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-left: 0.25rem;
    color: #4a5568;
  `;
  
  const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    animation: ${fadeIn} 0.3s ease-in-out;
    z-index: 1000;
  `;
  
  const ModalContent = styled.div`
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 80%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    animation: ${fadeIn} 0.1s ease-in-out 0.1s both;
  `;
  
  const TableContainer = styled.div`
    flex: 1;
    overflow: hidden;
    display: flex;
    width: 100%;
  `;
  
  const TableWrapper = styled.div`
    flex: 1;
    overflow-x: auto;
  `;
  
  const StyledTable = styled.table`
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  `;
  
  const TableHeader = styled.th`
    background-color: #f2f2f2;
    padding: 12px 16px;
    text-align: left;
    position: sticky;
    top: 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #ddd;
  `;
  
  const TableRow = styled.tr`
    &:nth-child(even) {
      background-color: #f8f8f8;
    }
  
    &:hover {
      background-color: #e8e8e8;
      cursor: pointer;
    }
  `;
  
  const TableCell = styled.td`
    padding: 12px 16px;
    font-size: 14px;
    color: #444;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  `;
  
  const SearchModalInput = styled.input`
    width: 40%;
    padding: 5px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 0.35rem;
    color: var(--light-input-text-color);
    background-color: var(--light-input-bg-color);
    font-size: 14px;
    font-family: "Poppins", sans-serif;
    min-height: 40px;
  
    &::placeholder {
      color: #9ca6b7;
      font-size: 12px;
      transition:
        font-size 0.5s ease,
        transform 0.5s ease;
    }
  
    &:focus-visible {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
    }
  
    &::placeholder {
      color: #9ca6b7;
      font-size: 12px;
      transition:
        font-size 0.5s ease,
        transform 0.5s ease;
    }
  
    &:focus::placeholder {
      font-size: 0.5rem;
      transform: translateY(-0.6rem);
      color: #9ca3af6c;
    }
  `;
  