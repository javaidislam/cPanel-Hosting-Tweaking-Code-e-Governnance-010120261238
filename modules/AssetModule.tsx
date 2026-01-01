
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService.ts';
import { Asset, AssetCategory } from './AssetModule/types.ts';

export const AssetModule: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeTab, setActiveTab] = useState<AssetCategory | 'All'>('All');

  useEffect(() => {
    DataService.getAssets().then(setAssets);
  }, []);

  const categories: { key: AssetCategory | 'All'; label: string; icon: string }[] = [
    { key: 'All', label: 'All Assets', icon: 'fa-layer-group' },
    { key: 'Vehicle', label: 'Vehicles', icon: 'fa-car' },
    { key: 'SchoolBuilding', label: 'Schools', icon: 'fa-school' },
    { key: 'HospitalBuilding', label: 'Hospitals', icon: 'fa-hospital' },
    { key: 'Canal', label: 'Canals', icon: 'fa-water' },
    { key: 'Road', label: 'Roads & Highways', icon: 'fa-road' },
  ];

  const filteredAssets = activeTab === 'All' ? assets : assets.filter(a => a.category === activeTab);

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(val);
  };

  return (
    <div className="p-8 h-full bg-gray-50 overflow-y-auto">
      <h1 className="text-3xl font-serif font-bold text-gov-green mb-6">Fixed & Movable Asset Management</h1>
      
      {/* Asset Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-4">
          {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === cat.key 
                    ? 'bg-gov-green text-white shadow-lg' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                  <i className={`fas ${cat.icon}`}></i>
                  <span>{cat.label}</span>
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-5">
                    <div className="flex justify-between items-start">
                        <div className="p-2 bg-green-50 rounded-lg text-gov-green">
                            <i className={`fas fa-2x ${
                                asset.category === 'Vehicle' ? 'fa-car' : 
                                asset.category === 'Barrage' ? 'fa-water' : 'fa-building'
                            }`}></i>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${
                            asset.condition === 'Good' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                            {asset.condition}
                        </span>
                    </div>
                    
                    <h3 className="mt-4 text-lg font-bold text-gray-800">{asset.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{asset.location}</p>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Value:</span>
                            <span className="font-mono font-bold">{formatCurrency(asset.value)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Department:</span>
                            <span>{asset.departmentId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Acquired:</span>
                            <span>{new Date(asset.acquisitionDate).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Specifications</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(asset.specifications).map(([key, val]) => (
                                <div key={key} className="bg-gray-50 p-1.5 rounded">
                                    <span className="text-gray-500 block">{key}</span>
                                    <span className="font-semibold">{val}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t flex justify-between items-center">
                    <button className="text-gov-green text-sm font-semibold hover:underline">View History</button>
                    <button className="text-gray-400 hover:text-gray-600"><i className="fas fa-edit"></i></button>
                </div>
            </div>
        ))}

        {/* Add New Card */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-8 cursor-pointer hover:border-gov-green hover:bg-green-50 transition-colors group">
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-white flex items-center justify-center mb-3">
                <i className="fas fa-plus text-gray-400 group-hover:text-gov-green"></i>
            </div>
            <span className="text-gray-500 font-medium group-hover:text-gov-green">Register New Asset</span>
        </div>
      </div>
    </div>
  );
};