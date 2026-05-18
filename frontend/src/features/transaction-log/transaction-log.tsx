import { List, Stack } from "@mui/material";
import { FilterContext } from "lib/context/context";
import { getDeliveryOrderByID } from "lib/database/delivery-orders-api";
import { supabase } from "lib/database/supabase";
import { getAllTransactions } from "lib/database/transactions-api";
import { useContext, useEffect, useState, useCallback } from "react";
import type { deliveryOrder, transaction } from "types/supabase";
import TransactionCardModal from "./components/transaction-card-modal";
import TransactionMessage from "./components/transaction-message";
import { filterTransactionsByProductID } from "./lib/sortTransactions";

function TransactionLog() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<transaction>();
  const [
    selectedTransactionDeliveryOrder,
    setSelectedTransactionDeliveryOrder,
  ] = useState<deliveryOrder>();

  async function handleSelectTransaction(transaction: transaction) {
    setSelectedTransaction(transaction);
    setSelectedTransactionDeliveryOrder(undefined);
    if (transaction.deliveryID) {
      const selectedDeliverOrder = await getDeliveryOrderByID(
        transaction.deliveryID,
      );
      setSelectedTransactionDeliveryOrder(selectedDeliverOrder[0]);
    }
  }

  const { filter, filterArg } = useContext(FilterContext);

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  const [transactions, setTransactions] = useState<transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    transaction[]
  >([]);

  useEffect(() => {
    switch (filter) {
      case "none":
        setFilteredTransactions(transactions);
        break;
      case "productid":
        setFilteredTransactions(
          filterTransactionsByProductID(filterArg, transactions),
        );
        break;
      default:
        console.error("Filter broke: ", filter);
        break;
    }
  }, [filter, filterArg, transactions]);

  const fetchTransactions = useCallback(async () => {
    const transactions = await getAllTransactions();
    setTransactions(transactions);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const channel = supabase.channel("transactions-channel");
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        (_payload) => {
          window.location.reload();
          // fetchTransactions();
          // For some reason, transactions & filteredTransactions are both empty...
          // Probably due to the fact I'm calling useEffect(fetchTransactions) & there's some form of desync
          // Date also can't be properly parsed
          // const newTransaction = payload.new as transaction;
          // setTransactions([...transactions, newTransaction]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <>
      <List>
        <Stack>
          {filteredTransactions.length === 0 && <p>Nothing matches filters</p>}
          {filteredTransactions.length > 0 &&
            filteredTransactions.map((transaction) => (
              <TransactionMessage
                transaction={transaction}
                key={transaction.id}
                handleOpenModal={openModal}
                selectTransaction={handleSelectTransaction}
              />
            ))}
        </Stack>
      </List>

      {selectedTransaction && (
        <TransactionCardModal
          isModalOpen={isModalOpen}
          handleCloseModal={closeModal}
          transactionData={selectedTransaction}
          deliveryOrderData={selectedTransactionDeliveryOrder}
        />
      )}
    </>
  );
}

export default TransactionLog;
