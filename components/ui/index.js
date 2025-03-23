// Export all UI components for easier imports
import Button from "./Button";
import LegacyCard, { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./Card";
import LegacyTable, { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "./Table";
import Modal from "./Modal";
import { Input } from "./Input";
import Badge from "./Badge";

export {
  // Button
  Button,
  
  // Card Components
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  LegacyCard as CardLegacy,
  
  // Table Components
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  LegacyTable as TableLegacy,
  
  // Form Components
  Input,
  
  // Modal
  Modal,
  
  // Badge
  Badge
};