import React, { useState } from 'react';
import { Plus, X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/supabaseClient';

const AddNewMenuItemWizard = ({ tenantId, onItemCreated, prepSchedule, selectedDate }) => {
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [station, setStation] = useState('');
  const [portionSize, setPortionSize] = useState('');
  const [baseUnit, setBaseUnit] = useState('lb');
  const [initialPar, setInitialPar] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [addToPrepList, setAddToPrepList] = useState(true); // NEW: checkbox to add to prep list

  const resetForm = () => {
    setItemName('');
    setCategory('');
    setStation('');
    setPortionSize('');
    setBaseUnit('lb');
    setInitialPar('');
    setCostPerUnit('');
    setAddToPrepList(true);
    setCurrentStep(1);
  };

  const closeWizard = () => {
    setShowWizard(false);
    resetForm();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create new menu item
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .insert([{
          tenant_id: tenantId,
          name: itemName,
          category_normalized: category,
          portion_size: parseFloat(portionSize),
          base_unit: baseUnit,
          cost_per_unit: costPerUnit ? parseFloat(costPerUnit) : null
        }])
        .select()
        .single();

      if (menuError) throw menuError;

      // Create initial prep rule if par level provided
      if (initialPar && menuItem) {
        const { error: ruleError } = await supabase
          .from('prep_rules')
          .insert([{
            tenant_id: tenantId,
            menu_item_id: menuItem.id,
            base_quantity: parseFloat(initialPar),
            base_unit: baseUnit,
            rule_type: 'fixed'
          }]);

        if (ruleError) console.error('Error creating prep rule:', ruleError);
      }

      // Add to prep list if checkbox is checked
      if (addToPrepList && menuItem && selectedDate) {
        // Check if prep_schedule exists for this date
        let { data: schedule, error: scheduleError } = await supabase
          .from('prep_schedules')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('date', selectedDate)
          .single();

        // Create schedule if it doesn't exist
        if (scheduleError && scheduleError.code === 'PGRST116') {
          const { data: newSchedule, error: createError } = await supabase
            .from('prep_schedules')
            .insert([{
              tenant_id: tenantId,
              date: selectedDate,
              expected_guests: prepSchedule?.expected_guests || 200,
              status: 'draft'
            }])
            .select()
            .single();

          if (createError) throw createError;
          schedule = newSchedule;
        }

        if (schedule) {
          // Get station ID
          const { data: stationData } = await supabase
            .from('prep_stations')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('name', station)
            .single();

          // Calculate quantity
          const quantity = (schedule.expected_guests * parseFloat(portionSize)).toFixed(2);

          // Add to prep_tasks
          const { error: taskError } = await supabase
            .from('prep_tasks')
            .insert([{
              schedule_id: schedule.id,
              menu_item_id: menuItem.id,
              station_id: stationData?.id,
              prep_quantity: parseFloat(quantity),
              prep_unit: baseUnit,
              status: 'pending'
            }]);

          if (taskError) console.error('Error adding to prep list:', taskError);
        }
      }

      // Success!
      alert(`✅ Successfully created "${itemName}"!${addToPrepList ? ' Added to prep list.' : ''}`);
      closeWizard();
      
      if (onItemCreated) {
        onItemCreated();
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      alert('Failed to create menu item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return itemName.trim().length > 0;
      case 2:
        return category.trim().length > 0 && station.trim().length > 0;
      case 3:
        return portionSize && parseFloat(portionSize) > 0;
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowWizard(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
      >
        <Plus size={20} />
        Add New Menu Item
      </button>

      {showWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4">
            {/* Header */}
            <div className="bg-purple-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div>
                <h2 className="text-2xl font-bold">Add New Menu Item</h2>
                <p className="text-purple-100 text-sm mt-1">Step {currentStep} of 4</p>
              </div>
              <button
                onClick={closeWizard}
                className="text-white hover:bg-purple-700 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-100 h-2">
              <div
                className="bg-purple-600 h-2 transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>

            {/* Content */}
            <div className="p-8 min-h-[400px]">
              {/* Step 1: Item Name */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">What's the item name?</h3>
                    <p className="text-gray-600">Enter the name as it should appear on prep lists</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Pulled Pork, Potato Salad, Peach Cobbler"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Category & Station */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Category & Station</h3>
                    <p className="text-gray-600">How should this item be organized?</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        // Auto-set station based on category
                        if (e.target.value === 'protein') setStation('Smoker');
                        else if (e.target.value === 'side') setStation('Hot Sides');
                        else if (e.target.value === 'dessert') setStation('Dessert');
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                    >
                      <option value="">Choose a category...</option>
                      <option value="protein">Protein (BBQ Meats)</option>
                      <option value="side">Side Dish</option>
                      <option value="dessert">Dessert</option>
                      <option value="sauce">Sauce / Condiment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prep Station *
                    </label>
                    <select
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                    >
                      <option value="">Choose a station...</option>
                      <option value="Smoker">Smoker</option>
                      <option value="Hot Sides">Hot Sides</option>
                      <option value="Cold Prep">Cold Prep</option>
                      <option value="Dessert">Dessert</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Portion Size */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Portion Size</h3>
                    <p className="text-gray-600">How much per guest?</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-900">
                      <strong>Example:</strong> If each guest gets 0.25 lb of Brisket, enter "0.25" and select "lb"
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portion Size *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={portionSize}
                        onChange={(e) => setPortionSize(e.target.value)}
                        placeholder="0.25"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit *
                      </label>
                      <select
                        value={baseUnit}
                        onChange={(e) => setBaseUnit(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
                      >
                        <option value="lb">lb (pounds)</option>
                        <option value="each">each</option>
                        <option value="oz">oz (ounces)</option>
                        <option value="gal">gal (gallons)</option>
                        <option value="qt">qt (quarts)</option>
                      </select>
                    </div>
                  </div>

                  {portionSize && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-900 font-semibold">
                        For 200 guests: {(parseFloat(portionSize) * 200).toFixed(2)} {baseUnit}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Optional Details */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Optional Details</h3>
                    <p className="text-gray-600">Add cost and par level (you can skip this)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Par Level (optional)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialPar}
                      onChange={(e) => setInitialPar(e.target.value)}
                      placeholder="Base quantity to always prep"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The smart algorithm will adjust this based on actual sales
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Per Unit (optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-500 text-lg">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={costPerUnit}
                        onChange={(e) => setCostPerUnit(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Add to Prep List Checkbox */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addToPrepList}
                        onChange={(e) => setAddToPrepList(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-semibold text-blue-900">Add to today's prep list</span>
                        <p className="text-xs text-blue-700 mt-1">Automatically add this item to the prep schedule for {selectedDate}</p>
                      </div>
                    </label>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-bold text-purple-900 mb-2">Summary</h4>
                    <ul className="space-y-1 text-sm text-purple-900">
                      <li><strong>Item:</strong> {itemName}</li>
                      <li><strong>Category:</strong> {category}</li>
                      <li><strong>Station:</strong> {station}</li>
                      <li><strong>Portion:</strong> {portionSize} {baseUnit} per guest</li>
                      {initialPar && <li><strong>Par Level:</strong> {initialPar} {baseUnit}</li>}
                      {costPerUnit && <li><strong>Cost:</strong> ${costPerUnit} per {baseUnit}</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Navigation */}
            <div className="border-t border-gray-200 px-8 py-4 flex items-center justify-between bg-gray-50 rounded-b-lg">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ArrowLeft size={18} />
                Back
              </button>

              <div className="flex gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      step === currentStep
                        ? 'bg-purple-600'
                        : step < currentStep
                        ? 'bg-purple-400'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    'Creating...'
                  ) : (
                    <>
                      <Check size={18} />
                      Create Item
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddNewMenuItemWizard;
