
import React, { useState, useEffect } from 'react';
import { DataService } from '../../../../services/dataService';
import { Official } from '../../../../types/shared';

const RouteFileModal: React.FC<{ onClose: () => void; onRoute: (targetId: string, remarks: string) => void }> = ({ onClose, onRoute }) => {
    const [users, setUsers] = useState<Official[]>([]);
    const [selectedOfficerId, setSelectedOfficerId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        DataService.getUsers().then(data => {
            setUsers(data);
            if (data.length > 0) setSelectedOfficerId(data[0].id);
            setLoading(false);
        });
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col">
                <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gov-green">Mark & Route File</h3>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><i className="fas fa-times"></i></button>
                </div>
                <div className="p-6">
                    {loading ? <div className="text-center py-4">Loading Officials...</div> : (
                    <>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route To</label>
                        <select className="w-full border rounded p-2 outline-none" value={selectedOfficerId} onChange={(e) => setSelectedOfficerId(e.target.value)}>
                            {users.map((officer) => (<option key={officer.id} value={officer.id}>{officer.designation} - {officer.name}</option>))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                        <textarea className="w-full border rounded p-2 outline-none" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Reason for routing..."></textarea>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        {/* Fix: Passed 'remarks' as the second argument to satisfy the onRoute function signature. */}
                        <button onClick={() => onRoute(selectedOfficerId, remarks)} className="px-4 py-2 bg-gov-green text-white rounded shadow hover:bg-green-800 font-bold"><i className="fas fa-paper-plane mr-2"></i> Route File</button>
                    </div>
                    </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RouteFileModal;
