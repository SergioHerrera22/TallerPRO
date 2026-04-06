import * as React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { cn } from "./utils";

type PaginationMarker = number | "ellipsis";

type DataPaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
};

export function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage: safePage,
    totalPages,
    totalItems,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: totalItems === 0 ? 0 : endIndex,
    pageItems: items.slice(startIndex, endIndex),
  };
}

function buildPaginationMarkers(
  currentPage: number,
  totalPages: number,
): PaginationMarker[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [
    1,
    "ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis",
    totalPages,
  ];
}

export function DataPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "registros",
  className,
}: DataPaginationProps) {
  const { currentPage: safePage, totalPages, startItem, endItem } =
    paginateItems(Array.from({ length: totalItems }), currentPage, pageSize);

  if (totalItems === 0) {
    return null;
  }

  const markers = buildPaginationMarkers(safePage, totalPages);

  const handlePageChange = (
    event: React.MouseEvent<HTMLAnchorElement>,
    page: number,
  ) => {
    event.preventDefault();

    if (page === safePage || page < 1 || page > totalPages) {
      return;
    }

    onPageChange(page);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <p>
        Mostrando {startItem}-{endItem} de {totalItems} {itemLabel}
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-start md:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => handlePageChange(event, safePage - 1)}
                className={safePage === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>

            {markers.map((marker, index) => (
              <PaginationItem key={`${marker}-${index}`}>
                {marker === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={marker === safePage}
                    onClick={(event) => handlePageChange(event, marker)}
                  >
                    {marker}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => handlePageChange(event, safePage + 1)}
                className={
                  safePage === totalPages
                    ? "pointer-events-none opacity-50"
                    : undefined
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}