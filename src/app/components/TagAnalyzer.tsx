import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface AnalysisResults {
  data: string[][];
  overtags: (string | "∅")[];
  undertags: (string | "∅")[];
  l1Tags: string[];
}

const TagAnalyzer: React.FC = () => {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getMismatchedTags = (content: string[][], type: "over" | "under" = "over") => {
    const output: (string[] | "∅")[] = [];
    const [sourceIdx, destIdx] = type === "over" ? [3, 2] : [2, 3];
    
    for (let i = 1; i < content.length; i++) {
      const sourceCol = content[i][sourceIdx];
      const destCol = content[i][destIdx];
      
      if (sourceCol === "") {
        output.push([destCol]);
      } else if (destCol === "") {
        output.push("∅");
      } else {
        const sourceTags = sourceCol.split(",");
        const destTags = destCol.split(",");
        const filtered = destTags.filter(value => !sourceTags.includes(value));
        output.push(filtered.length > 0 ? [filtered.join(",")] : "∅");
      }
    }
    return output;
  };

  const getL1Tags = (content: string[][]) => {
    const uniqueTags = new Set<string>();
    
    for (let i = 1; i < content.length; i++) {
      const agentFlags = content[i][2];
      const qaFlags = content[i][3];
      
      const allFlags = [agentFlags, qaFlags]
        .filter(Boolean)
        .flatMap(flags => flags.split(","));
      
      allFlags.forEach(flag => {
        if (flag.includes("::")) {
          const l1Tag = flag.split("::")[1].trim();
          uniqueTags.add(l1Tag);
        }
      });
    }
    
    return Array.from(uniqueTags).sort();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        try {
          const { data } = results;
          
          // Validate headers
          const headers = data[0];
          if (headers.length !== 5 || 
              headers[0] !== 'Task Link' ||
              headers[1] !== 'Actioned Date' ||
              headers[2] !== 'All Agent Flags' ||
              headers[3] !== 'All QA Flags' ||
              headers[4] !== 'Agent') {
            setError('Invalid CSV format. Please check the column headers.');
            return;
          }

          // Filter out empty rows and process data
          const filteredContent = data.filter(row => row[3] !== '');
          const overtags = getMismatchedTags(filteredContent);
          const undertags = getMismatchedTags(filteredContent, "under");
          const l1Tags = getL1Tags(filteredContent);

          setResults({
            data: filteredContent,
            overtags,
            undertags,
            l1Tags
          });
          setError(null);
        } catch (err) {
          setError('Error processing file: ' + (err as Error).message);
        }
      },
      error: (error) => {
        setError('Error parsing CSV: ' + error.message);
      }
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Tag Analysis Tool</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400" />
                <span className="mt-2 text-sm text-gray-600">
                  Upload CSV file
                </span>
              </label>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Display */}
            {results && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Analysis Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Overtags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto">
                          {results.overtags.map((tag, idx) => (
                            <div key={idx} className="py-1 border-b">
                              {tag === "∅" ? "None" : tag}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Undertags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto">
                          {results.undertags.map((tag, idx) => (
                            <div key={idx} className="py-1 border-b">
                              {tag === "∅" ? "None" : tag}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">L1 Tags Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {results.l1Tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TagAnalyzer;