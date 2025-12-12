import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Database, ChevronDown } from 'lucide-react';
import { Button, Input, Card } from '../ui/Common';
import { WizardState } from '../../types';
import { postgresApi, ApiError } from '../../services/api';
const POSTGRES_LOGO = "https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg";

interface DbConnectStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const DATA_SOURCES = [
  { id: 'postgres', label: 'PostgreSQL Database', group: 'Databases', disabled: false },
  { id: 'mysql', label: 'MySQL (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'mssql', label: 'Microsoft SQL Server (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'oracle', label: 'Oracle DB (Coming Soon)', group: 'Databases', disabled: true },
  { id: 'mongo', label: 'MongoDB (Coming Soon)', group: 'NoSQL', disabled: true },
  { id: 'snowflake', label: 'Snowflake (Coming Soon)', group: 'Warehouses', disabled: true },
  { id: 'csv', label: 'Upload CSV File (Coming Soon)', group: 'Files', disabled: true },
  { id: 'json', label: 'Upload JSON File (Coming Soon)', group: 'Files', disabled: true },
  { id: 'excel', label: 'Upload Excel File (Coming Soon)', group: 'Files', disabled: true },
];

export const DbConnectStep: React.FC<DbConnectStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState('postgres');

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('idle');
    setErrorMessage(null);

    try {
      const response = await postgresApi.connect({
        dbHost: data.dbHost,
        dbPort: data.dbPort,
        dbUser: data.dbUser,
        dbPass: data.dbPass,
        dbName: data.dbName,
      });

      updateData({ connectionId: response.connection_id });
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to connect to server');
      }
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Connect Your Data</h2>
        <p className="text-slate-500 text-sm">Select your data source and configure the connection details.</p>
      </div>

      <Card className="shadow-supreme border-0">

        {/* Source Selection Dropdown */}
        <div className="mb-4 border-b border-slate-100 pb-4">
          <label className="text-xs font-semibold text-slate-700 ml-1 mb-1.5 block">Data Source Type</label>
          <div className="relative group">
            <select
              className="w-full appearance-none pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer transition-all hover:border-brand-300 disabled:bg-slate-50"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            >
              {DATA_SOURCES.map((source) => (
                <option key={source.id} value={source.id} disabled={source.disabled}>
                  {source.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-brand-50 rounded-md">
              <Database className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none group-hover:text-brand-500 transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
          {/* PostgreSQL Logo Asset */}
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-900/10 ring-1 ring-slate-100 overflow-hidden relative group p-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src={POSTGRES_LOGO}
              alt="PostgreSQL Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">PostgreSQL Connection</h3>
            <p className="text-xs text-slate-500">Supports Postgres 12+</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Host"
                placeholder="db.example.com"
                value={data.dbHost}
                onChange={(e) => updateData({ dbHost: e.target.value })}
              />
            </div>
            <div className="col-span-1">
              <Input
                label="Port"
                placeholder="5432"
                value={data.dbPort}
                onChange={(e) => updateData({ dbPort: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Username"
              placeholder="postgres"
              value={data.dbUser}
              onChange={(e) => updateData({ dbUser: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={data.dbPass}
              onChange={(e) => updateData({ dbPass: e.target.value })}
            />
          </div>

          <Input
            label="Database Name"
            placeholder="my_production_db"
            value={data.dbName}
            onChange={(e) => updateData({ dbName: e.target.value })}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            isLoading={isTesting}
            size="sm"
            className="bg-slate-50 hover:bg-slate-100 border-slate-200 text-xs px-3"
          >
            Test Connection
          </Button>

          {connectionStatus === 'success' && (
            <div className="flex items-center gap-1.5 text-brand-600 text-xs font-bold animate-in fade-in slide-in-from-right-4 bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified
            </div>
          )}
          {connectionStatus === 'error' && (
            <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                <AlertCircle className="w-3.5 h-3.5" />
                Connection Failed
              </div>
              {errorMessage && (
                <span className="text-[11px] text-red-500 mt-1 max-w-[180px] text-right truncate" title={errorMessage}>
                  {errorMessage}
                </span>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between pt-6">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={connectionStatus !== 'success'}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          size="md"
          className="px-6 shadow-brand-600/30"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};