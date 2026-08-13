export const PAGE_SIZE = 6;

export function getFilteredInspections(inspections = [], searchTerm = "") {
  const term = String(searchTerm || "").trim().toLowerCase();

  if (!term) return [...inspections];

  return inspections.filter((inspection) => {
    const fullName = inspection?.citizenId?.fullName || "";
    const email = inspection?.citizenId?.email || "";
    const type = inspection?.type || "";
    const text = `${fullName} ${email} ${type}`.toLowerCase();
    return text.includes(term);
  });
}

export function getPagedInspections(inspections = [], page = 1, pageSize = PAGE_SIZE) {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : PAGE_SIZE;
  const totalItems = inspections.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / safePageSize);
  const validPage = Math.min(Math.max(safePage, 1), totalPages);
  const startIndex = (validPage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;
  const items = inspections.slice(startIndex, endIndex);

  return {
    items,
    page: validPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex: Math.min(endIndex, totalItems) - 1,
  };
}
