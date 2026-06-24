import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.path ? (
                <Link to={item.path} className="text-farm-primary hover:text-farm-primary-dark transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-700 font-medium">{item.label}</span>
              )}
              {idx < items.length - 1 && (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
