type AssetActionsProps = {
  onAddHouse: () => void;
  onAddGold: () => void;
};


export default function AssetActions({onAddHouse, onAddGold}: AssetActionsProps){
    return(
        <section>
      <h2>Actions</h2>
      <button onClick={onAddHouse}>Add Sample House</button>
      <button onClick={onAddGold}>Add Sample Gold</button>
    </section>



    );

};