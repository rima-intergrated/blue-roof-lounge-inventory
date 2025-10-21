function SalesSummary () {
  return(
    <div className="sales-summary-container">
      <div className="sales-summary-title">
          <h2>Sales Summary</h2>
            <select className="sales-input">
              <option value="All">All</option>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </select>
      </div>
      <div className="sales-mini-container">        

        <div className="sales-information">
          <div className="sales-items">
            <h2 className="item">Date</h2>
            <h2 className="item">Item</h2>
            <h2 className="cost-price">Cost price</h2>
            <h2 className="selling-price">Selling price</h2>
            <h2 className="quantity-available">Quantity Sold</h2>
            <h2 className="sub-total">Sub-total</h2>
          </div>

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>    

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div> 

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>  

          <div className="item-info">
            <p className="item">08/09/25</p>
            <p className="item">Chill</p>
            <p className="cost-price">12,000</p>
            <p className="selling-price">8,000</p>
            <p className="quantity-available">16</p>
            <p className="sub-total">33,000</p>
          </div>   
      </div>   
      </div>       

    </div>
  );
}

export default SalesSummary;