
type AssetSummaryProps = {
  totalCash: number;
  totalExpenses: number;
};


export default function AssetSummary({totalCash, totalExpenses}: AssetSummaryProps){
    return(
        <section>
      <h2>Summary</h2>
      <p>Total Cash: ${totalCash.toLocaleString()}</p>
      <p>Total Expenses: ${totalExpenses.toLocaleString()}/month</p>
    </section>
    
);

}
