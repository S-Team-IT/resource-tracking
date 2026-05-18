import { supabase } from "./supabase";

export async function insertNewOutgoingTransaction(
  useDate: Date,
  name: string,
  description: string,
): Promise<string> {
  const { error, data } = await supabase
    .from("outgoing_transactions")
    .insert({
      user_name: name,
      description,
      use_date: useDate,
    })
    .select("deliveryOrderID:id")
    .single();
  if (error) {
    console.error("Error inserting delivery order: ", error);
    return "";
  }
  return (
    data as {
      deliveryOrderID: string;
    }
  ).deliveryOrderID;
}
