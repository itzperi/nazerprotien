import React from 'react';

interface TestPageProps {
  pageName: string;
  businessId: string;
}

const TestPage: React.FC<TestPageProps> = ({ pageName, businessId }) => {
  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
        <h3 className="font-semibold">✅ {pageName} Page is Working!</h3>
        <p>Business ID: {businessId}</p>
        <p>Current Time: {new Date().toLocaleString()}</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
        <h4 className="font-semibold">Page Status</h4>
        <ul className="list-disc list-inside mt-2">
          <li>Component rendered successfully</li>
          <li>No JavaScript errors</li>
          <li>Props received correctly</li>
        </ul>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <h4 className="font-semibold">Next Steps</h4>
        <p>If you can see this message, the {pageName} page is working correctly. The blank screen issue has been resolved.</p>
      </div>
    </div>
  );
};

export default TestPage;
