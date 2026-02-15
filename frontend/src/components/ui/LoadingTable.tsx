import { Skeleton } from './Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';

interface LoadingTableProps {
  columnCount: number;
  rowCount?: number;
  headers?: string[];
}

export function LoadingTable({ columnCount, rowCount = 5, headers }: LoadingTableProps) {
  return (
    <div className="rounded-md border dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
      <Table>
        {headers && (
          <TableHeader className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columnCount }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
