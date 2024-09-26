import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, fetchAll: fetchAllEmployees, loading: employeesLoading } = useEmployees();
  const { data: paginatedTransactions, fetchAll: fetchPaginatedTransactions, invalidateData: invalidatePaginatedTransactions, loading: paginatedTransactionsLoading } = usePaginatedTransactions();
  const { data: transactionsByEmployee, fetchById: fetchTransactionsByEmployee, invalidateData: invalidateTransactionsByEmployee } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [showViewMore, setShowViewMore] = useState(true);

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    invalidateTransactionsByEmployee();

    await fetchAllEmployees();
    await fetchPaginatedTransactions();

    setIsLoading(false);
  }, [fetchAllEmployees, fetchPaginatedTransactions, invalidateTransactionsByEmployee]);

  const loadTransactionsByEmployee = useCallback(async (employeeId: string) => {
    invalidatePaginatedTransactions();
    await fetchTransactionsByEmployee(employeeId);
    setShowViewMore(false);
  }, [invalidatePaginatedTransactions, fetchTransactionsByEmployee]);

  useEffect(() => {
    if (paginatedTransactions?.nextPage === null && !!paginatedTransactions?.data) {
      setShowViewMore(false);
    }
  }, [paginatedTransactions]);

  useEffect(() => {
    if (!employees && !employeesLoading) {
      loadAllTransactions();
    }
  }, [employees, employeesLoading, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees ? [EMPTY_EMPLOYEE, ...employees] : []}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (!newValue) return;

            if (newValue.firstName === "All" && newValue.lastName === "Employees") {
              await loadAllTransactions();
              setShowViewMore(true);
            } else {
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {transactions && showViewMore && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsLoading}
              onClick={loadAllTransactions}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
