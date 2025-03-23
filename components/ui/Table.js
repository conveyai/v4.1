import { cn } from "@/utils/cn";

export function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full text-left border-collapse", className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TableFooter({ className, ...props }) {
  return <tfoot className={cn("", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn("border-b hover:bg-gray-50 transition-colors", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn(
        "p-4 font-medium text-gray-900 bg-gray-50 text-left",
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return <td className={cn("p-4", className)} {...props} />;
}

// For backward compatibility
export default function LegacyTable({ columns, data, className, ...props }) {
  return (
    <div className={cn("overflow-x-auto bg-white shadow-md rounded-lg p-4", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((col) => (
                <TableCell key={`${index}-${col}`}>{row[col]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}