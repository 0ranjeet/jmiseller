// components/LotDrawer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './LotDrawer.css';

const LotDrawer = ({
  isOpen,
  onClose,
  onSave,
  productName = '',
  specification = 'PLANE',
  initialLotSizes = [],
  sizeOptions = [],
  mode = 'create' // 'create' or 'edit'
}) => {
  const [lotSizes, setLotSizes] = useState([]);
  const sizeRowRefs = useRef({});

  // Initialize lot sizes when component opens or initialLotSizes changes
  useEffect(() => {
    if (isOpen) {
      if (initialLotSizes.length > 0) {
        setLotSizes(initialLotSizes);
      } else {
        setLotSizes([{ 
          size: '', 
          set: '', 
          grossWt: '', 
          netWt: '', 
          avgGrossWt: '', 
          avgNetWt: '', 
          avgSpecWt: '' 
        }]);
      }
    }
  }, [isOpen, initialLotSizes]);

  const setSizeRowRef = (index, element) => {
    if (element) {
      sizeRowRefs.current[index] = element;
    }
  };

  // Calculate averages for a single item
  const calculateItemAverages = (item) => {
    const set = parseFloat(item.set) || 1;
    const grossWt = parseFloat(item.grossWt) || 0;
    const netWt = parseFloat(item.netWt) || 0;
    
    return {
      avgGrossWt: (grossWt / set).toFixed(3),
      avgNetWt: (netWt / set).toFixed(3),
      avgSpecWt: specification !== 'PLANE' ? ((grossWt - netWt) / set).toFixed(3) : '0.000'
    };
  };

  // Calculate size-wise averages
  const calculateSizeAverages = () => {
    const sizeGroups = {};
    
    lotSizes.forEach(item => {
      if (item.size && item.netWt) {
        if (!sizeGroups[item.size]) {
          sizeGroups[item.size] = {
            count: 0,
            totalNetWt: 0,
            sets: 0,
            totalGrossWt: 0
          };
        }
        sizeGroups[item.size].count += 1;
        sizeGroups[item.size].totalNetWt += parseFloat(item.netWt) || 0;
        sizeGroups[item.size].sets += parseFloat(item.set) || 0;
        sizeGroups[item.size].totalGrossWt += parseFloat(item.grossWt) || 0;
      }
    });

    return Object.keys(sizeGroups).map(size => ({
      size,
      count: sizeGroups[size].count,
      averageNetWt: sizeGroups[size].totalNetWt / sizeGroups[size].count,
      totalSets: sizeGroups[size].sets,
      averageGrossWt: sizeGroups[size].totalGrossWt / sizeGroups[size].count
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    return {
      totalSets: lotSizes.reduce((sum, item) => sum + (parseFloat(item.set) || 0), 0),
      totalGrossWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.grossWt) || 0), 0),
      totalNetWt: lotSizes.reduce((sum, item) => sum + (parseFloat(item.netWt) || 0), 0)
    };
  };

  const handleSizeChange = (index, field, value) => {
    if (field === 'size') {
      // Check for duplicate sizes
      const duplicateIndex = lotSizes.findIndex(
        (item, i) => i !== index && item.size === value
      );

      if (duplicateIndex !== -1) {
        // Highlight duplicate row
        if (sizeRowRefs.current[duplicateIndex]) {
          sizeRowRefs.current[duplicateIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          const element = sizeRowRefs.current[duplicateIndex];
          element.classList.add('duplicate-highlight');
          setTimeout(() => {
            element.classList.remove('duplicate-highlight');
          }, 2000);
        }

        // Focus on duplicate's size select
        const duplicateSelect = document.querySelector(
          `[data-row-index="${duplicateIndex}"] select`
        );
        if (duplicateSelect) {
          duplicateSelect.focus();
        }
        return;
      }
    }

    const newSizes = [...lotSizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    
    // Recalculate averages when relevant fields change
    if (field === 'set' || field === 'grossWt' || field === 'netWt') {
      const averages = calculateItemAverages(newSizes[index]);
      newSizes[index] = {
        ...newSizes[index],
        avgGrossWt: averages.avgGrossWt,
        avgNetWt: averages.avgNetWt,
        avgSpecWt: averages.avgSpecWt
      };
    }
    
    setLotSizes(newSizes);
  };

  const handleAddSize = () => {
    const availableSizes = sizeOptions.filter(
      size => !lotSizes.some(item => item.size === size)
    );

    if (availableSizes.length === 0) {
      alert('All available sizes have been added.');
      return;
    }

    setLotSizes([...lotSizes, { 
      size: '', 
      set: '', 
      grossWt: '', 
      netWt: '', 
      avgGrossWt: '', 
      avgNetWt: '', 
      avgSpecWt: '' 
    }]);
  };

  const handleRemoveSize = (index) => {
    const newSizes = lotSizes.filter((_, i) => i !== index);
    setLotSizes(newSizes);
  };

  const handleSave = () => {
    // Update lot sizes with final averages
    const updatedLotSizes = lotSizes.map(item => {
      const averages = calculateItemAverages(item);
      return {
        ...item,
        avgGrossWt: averages.avgGrossWt,
        avgNetWt: averages.avgNetWt,
        avgSpecWt: averages.avgSpecWt
      };
    });

    const totals = calculateTotals();
    
    // Call the onSave callback with the lot data
    onSave({
      lotSizes: updatedLotSizes,
      totals: {
        totalSets: totals.totalSets,
        totalGrossWt: totals.totalGrossWt,
        totalNetWt: totals.totalNetWt
      }
    });
  };

  const sizeAverages = calculateSizeAverages();
  const totals = calculateTotals();

  const isFormValid = lotSizes.every(item => 
    item.size && item.set && item.grossWt && item.netWt
  );

  if (!isOpen) return null;

  return (
    <div className="lot-drawer-overlay" onClick={onClose}>
      <div className="lot-drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>
            {mode === 'create' ? 'Add' : 'Edit'} Lot Details
            {productName && ` - ${productName}`}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Size Input Section */}
          <div className="size-input-section">
            <div className="section-header">
              <h4>Add Size Details</h4>
              <button
                type="button"
                onClick={handleAddSize}
                className="add-size-btn"
                disabled={lotSizes.length >= sizeOptions.length}
              >
                + Add More Size
              </button>
            </div>

            {lotSizes.map((item, index) => (
              <div
                key={index}
                className="size-row"
                ref={el => setSizeRowRef(index, el)}
                data-row-index={index}
              >
                <div className="form-group">
                  <label>Size</label>
                  <select
                    value={item.size}
                    onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                    data-row-index={index}
                  >
                    <option value="">Select Size</option>
                    {sizeOptions.map(size => (
                      <option
                        key={size}
                        value={size}
                        disabled={lotSizes.some((item, i) => i !== index && item.size === size)}
                      >
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Set</label>
                  <input
                    type="number"
                    value={item.set}
                    min={1}
                    onChange={(e) => handleSizeChange(index, 'set', e.target.value)}
                    data-row-index={index}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Gross Wt. (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={item.grossWt}
                    onChange={(e) => handleSizeChange(index, 'grossWt', e.target.value)}
                    data-row-index={index}
                    placeholder="0.000"
                    min={1}
                  />
                </div>

                <div className="form-group">
                  <label>Net Wt. (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    min={1}
                    value={item.netWt}
                    onChange={(e) => handleSizeChange(index, 'netWt', e.target.value)}
                    data-row-index={index}
                    placeholder="0.000"
                  />
                </div>

                {lotSizes.length > 1 && (
                  <button
                    type="button"
                    className="remove-size-btn"
                    onClick={() => handleRemoveSize(index)}
                    title="Remove this size"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Size Averages Table */}
          {sizeAverages.length > 0 && (
            <div className="size-averages-section">
              <h4>Size & Totals</h4>
              <div className="averages-table">
                <table className='lot-table'>
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>Total Sets</th>
                      <th>Gross Wt (g)</th>
                      <th>Net Wt (g)</th>
                      {specification !== "PLANE" && <th>{specification} Wt (g)</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeAverages.map((avg, index) => (
                      <tr key={index}>
                        <td>{avg.size}</td>
                        <td>{avg.totalSets}</td>
                        <td>{avg.averageGrossWt.toFixed(3)}</td>
                        <td>{avg.averageNetWt.toFixed(3)}</td>
                        {specification !== "PLANE" && (
                          <td>{(avg.averageGrossWt - avg.averageNetWt).toFixed(3)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="totals-row">
                      <td>Total</td>
                      <td>{totals.totalSets}</td>
                      <td>{totals.totalGrossWt.toFixed(3)}</td>
                      <td>{totals.totalNetWt.toFixed(3)}</td>
                      {specification !== "PLANE" && (
                        <td>{(totals.totalGrossWt - totals.totalNetWt).toFixed(3)}</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={!isFormValid}
          >
            Save Lot
          </button>
        </div>
      </div>
    </div>
  );
};

export default LotDrawer;