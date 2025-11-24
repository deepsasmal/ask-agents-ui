import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../ui/Common';
import { WizardState } from '../../types';
import { postgresApi, ApiError } from '../../services/api';

interface DbConnectStepProps {
  data: WizardState;
  updateData: (data: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DbConnectStep: React.FC<DbConnectStepProps> = ({ data, updateData, onNext, onBack }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Connect Your Database</h2>
        <p className="text-slate-500">Securely connect to your PostgreSQL instance to fetch schema.</p>
      </div>

      <Card className="shadow-supreme border-0">
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-100">
           {/* PostgreSQL Logo Asset */}
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/10 ring-1 ring-slate-100 overflow-hidden relative group p-1.5">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
             <img 
               src="assets/postgres.svg" 
               alt="PostgreSQL Logo" 
               className="w-full h-full object-contain drop-shadow-sm" 
             />
           </div>
           <div>
             <h3 className="font-bold text-lg text-slate-900">PostgreSQL Connection</h3>
             <p className="text-sm text-slate-500">Supports Postgres 12+</p>
           </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
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

          <div className="grid grid-cols-2 gap-5">
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

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <Button 
                type="button" 
                variant="secondary" 
                onClick={handleTestConnection} 
                isLoading={isTesting}
                size="sm"
                className="bg-slate-50 hover:bg-slate-100 border-slate-200"
            >
                Test Connection
            </Button>

            {connectionStatus === 'success' && (
                <div className="flex items-center gap-2 text-brand-600 text-sm font-bold animate-in fade-in slide-in-from-right-4 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified
                </div>
            )}
             {connectionStatus === 'error' && (
                <div className="flex flex-col items-end animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <AlertCircle className="w-4 h-4" />
                      Connection Failed
                  </div>
                  {errorMessage && (
                    <span className="text-xs text-red-500 mt-1 max-w-[200px] text-right truncate" title={errorMessage}>
                      {errorMessage}
                    </span>
                  )}
                </div>
            )}
        </div>
      </Card>

      <div className="flex justify-between pt-10">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>
        <Button 
          onClick={onNext} 
          disabled={connectionStatus !== 'success'} 
          rightIcon={<ArrowRight className="w-4 h-4" />} 
          size="lg" 
          className="px-8 shadow-brand-600/30"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
