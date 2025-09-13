"use client";

import React, { useState } from "react";
import {
  Archive,
  Code,
  FileText,
  Image,
  Music,
  Video,
  Download,
  ExternalLink,
  Eye,
  Folder,
  File,
  Database,
  Globe,
  Palette,
  Box,
  Hash,
  FileImage,
  Calendar,
  Layers,
  HardDrive,
  Cpu,
  BarChart3
} from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface FileData {
  id: string;
  name: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
}

interface SpecializedPreviewProps {
  file: FileData;
  fileContent: string | null;
  onDownload: () => void;
}

// Archive Files Preview (ZIP, RAR, 7Z, TAR, etc.)
export function ArchivePreview({ file, onDownload }: SpecializedPreviewProps) {
  const archiveTypes = {
    'application/zip': { name: 'ZIP Archive', icon: Archive, color: 'text-yellow-600' },
    'application/x-rar-compressed': { name: 'RAR Archive', icon: Archive, color: 'text-red-600' },
    'application/x-7z-compressed': { name: '7-Zip Archive', icon: Archive, color: 'text-blue-600' },
    'application/x-tar': { name: 'TAR Archive', icon: Archive, color: 'text-green-600' },
    'application/gzip': { name: 'GZIP Archive', icon: Archive, color: 'text-purple-600' },
  };

  const archiveType = archiveTypes[file.mime as keyof typeof archiveTypes] || {
    name: 'Compressed Archive',
    icon: Archive,
    color: 'text-gray-600'
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className={`${archiveType.color} mb-4`}>
          <archiveType.icon className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{archiveType.name}</h3>
        <p className="text-gray-600 mb-4">
          This compressed archive contains multiple files. Download to extract and view contents.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">File Size:</span>
              <span className="font-medium">{formatFileSize(file.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Format:</span>
              <span className="font-medium">{file.name.split('.').pop()?.toUpperCase()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Download className="w-5 h-5" />
          Download Archive
        </button>
      </div>
    </div>
  );
}

// 3D Model Preview (OBJ, STL, GLTF, etc.)
export function Model3DPreview({ file, onDownload }: SpecializedPreviewProps) {
  const modelTypes = {
    'model/obj': { name: 'OBJ 3D Model', color: 'text-blue-600' },
    'model/stl': { name: 'STL 3D Model', color: 'text-green-600' },
    'model/gltf+json': { name: 'GLTF 3D Model', color: 'text-purple-600' },
    'application/octet-stream': { name: '3D Model', color: 'text-gray-600' },
  };

  const modelType = modelTypes[file.mime as keyof typeof modelTypes] || {
    name: '3D Model',
    color: 'text-gray-600'
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className={`${modelType.color} mb-4`}>
          <Box className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{modelType.name}</h3>
        <p className="text-gray-600 mb-4">
          This 3D model requires specialized software to view. Download to open in 3D modeling applications.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>Recommended Software:</strong></p>
            <ul className="space-y-1 text-left">
              <li>• Blender (Free)</li>
              <li>• MeshLab (Free)</li>
              <li>• Autodesk Maya</li>
              <li>• 3ds Max</li>
            </ul>
          </div>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Download className="w-5 h-5" />
          Download Model
        </button>
      </div>
    </div>
  );
}

// Data Files Preview (CSV, JSON, XML, etc.)
export function DataPreview({ file, fileContent, onDownload }: SpecializedPreviewProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  const parseCSV = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    const rows = lines.slice(1, 21).map(line => // Limit to first 20 rows
      line.split(',').map(cell => cell.trim().replace(/['"]/g, ''))
    );

    return { headers, rows };
  };

  const parseJSON = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  };

  const isCSV = file.mime.includes('csv') || file.name.toLowerCase().endsWith('.csv');
  const isJSON = file.mime.includes('json') || file.name.toLowerCase().endsWith('.json');
  const isXML = file.mime.includes('xml') || file.name.toLowerCase().endsWith('.xml');

  if (!fileContent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Database className="w-16 h-16 text-blue-600 mx-auto mb-4 opacity-50" />
          <p className="text-gray-600">Unable to load data file content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Data File</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'raw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Raw
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'raw' ? (
          <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap">
            {fileContent}
          </pre>
        ) : isCSV ? (
          <div className="p-4">
            {(() => {
              const { headers, rows } = parseCSV(fileContent);
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left text-sm font-medium text-gray-900 border-b border-gray-300">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length >= 20 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Showing first 20 rows. Download file to view all data.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        ) : isJSON ? (
          <div className="p-4">
            {(() => {
              const jsonData = parseJSON(fileContent);
              return jsonData ? (
                <pre className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-auto">
                  {JSON.stringify(jsonData, null, 2)}
                </pre>
              ) : (
                <div className="text-center text-red-600">
                  <p>Invalid JSON format</p>
                </div>
              );
            })()}
          </div>
        ) : (
          <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap">
            {fileContent}
          </pre>
        )}
      </div>
    </div>
  );
}

// Font Preview
export function FontPreview({ file, onDownload }: SpecializedPreviewProps) {
  const fontTypes = {
    'font/ttf': 'TrueType Font',
    'font/otf': 'OpenType Font',
    'font/woff': 'Web Font',
    'font/woff2': 'Web Font 2.0',
    'application/font-woff': 'Web Font',
  };

  const fontType = fontTypes[file.mime as keyof typeof fontTypes] || 'Font File';

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-lg p-8">
        <div className="text-indigo-600 mb-4">
          <Palette className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{fontType}</h3>
        <p className="text-gray-600 mb-6">
          Font files need to be installed on your system to preview. Download to install and use in applications.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Font Preview Sample</h4>
          <div className="space-y-2 text-left">
            <p className="text-2xl">The quick brown fox jumps over the lazy dog</p>
            <p className="text-lg">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="text-lg">abcdefghijklmnopqrstuvwxyz</p>
            <p className="text-lg">0123456789 !@#$%^&*()</p>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Preview shown in system default font. Download to see actual font.
          </p>
        </div>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Download className="w-5 h-5" />
          Download Font
        </button>
      </div>
    </div>
  );
}

// Executable/System Files Preview
export function ExecutablePreview({ file, onDownload }: SpecializedPreviewProps) {
  const executableTypes = {
    'application/x-msdownload': { name: 'Windows Executable', icon: HardDrive, color: 'text-blue-600' },
    'application/x-executable': { name: 'Linux Executable', icon: Cpu, color: 'text-green-600' },
    'application/x-mach-binary': { name: 'macOS Executable', icon: Cpu, color: 'text-gray-600' },
    'application/java-archive': { name: 'Java Archive', icon: Code, color: 'text-orange-600' },
    'application/x-deb': { name: 'Debian Package', icon: Box, color: 'text-red-600' },
    'application/x-rpm': { name: 'RPM Package', icon: Box, color: 'text-blue-600' },
  };

  const execType = executableTypes[file.mime as keyof typeof executableTypes] || {
    name: 'System File',
    icon: HardDrive,
    color: 'text-gray-600'
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className={`${execType.color} mb-4`}>
          <execType.icon className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{execType.name}</h3>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <Hash className="w-5 h-5" />
            <span className="font-medium">Security Warning</span>
          </div>
          <p className="text-sm text-red-700">
            This file may contain executable code. Only run files from trusted sources.
            Scan with antivirus before executing.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">File Size:</span>
              <span className="font-medium">{formatFileSize(file.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type:</span>
              <span className="font-medium">{file.name.split('.').pop()?.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
        >
          <Download className="w-5 h-5" />
          Download (Use Caution)
        </button>
      </div>
    </div>
  );
}

// Spreadsheet Preview
export function SpreadsheetPreview({ file, onDownload }: SpecializedPreviewProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className="text-green-600 mb-4">
          <BarChart3 className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Spreadsheet</h3>
        <p className="text-gray-600 mb-6">
          Excel and spreadsheet files can be viewed in Microsoft Excel, Google Sheets, or LibreOffice Calc.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <a
            href={`https://docs.google.com/spreadsheets/d/create?usp=drive_web&authuser=0&importurl=${encodeURIComponent(window.location.origin + '/api/files/' + file.id + '/download')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Sheets
          </a>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// CAD Files Preview
export function CADPreview({ file, onDownload }: SpecializedPreviewProps) {
  const cadTypes = {
    'application/acad': { name: 'AutoCAD Drawing', software: ['AutoCAD', 'DraftSight', 'FreeCAD'] },
    'application/dxf': { name: 'DXF Drawing', software: ['AutoCAD', 'QCAD', 'LibreCAD'] },
    'application/step': { name: 'STEP File', software: ['SolidWorks', 'Fusion 360', 'FreeCAD'] },
  };

  const cadType = cadTypes[file.mime as keyof typeof cadTypes] || {
    name: 'CAD File',
    software: ['CAD Software Required']
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className="text-blue-600 mb-4">
          <Layers className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{cadType.name}</h3>
        <p className="text-gray-600 mb-4">
          Computer-Aided Design file requires specialized CAD software to view and edit.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-gray-900 mb-2">Compatible Software:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {cadType.software.map((software, index) => (
              <li key={index}>• {software}</li>
            ))}
          </ul>
        </div>

        <button
          onClick={onDownload}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <Download className="w-5 h-5" />
          Download CAD File
        </button>
      </div>
    </div>
  );
}

// Email Files Preview (EML, MSG, etc.)
export function EmailPreview({ file, fileContent, onDownload }: SpecializedPreviewProps) {
  const [parsedEmail, setParsedEmail] = useState<any>(null);

  const parseEMLContent = (content: string) => {
    const lines = content.split('\n');
    const headers: Record<string, string> = {};
    let bodyStart = 0;

    // Parse headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') {
        bodyStart = i + 1;
        break;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    const body = lines.slice(bodyStart).join('\n').trim();

    return {
      from: headers['From'] || 'Unknown Sender',
      to: headers['To'] || 'Unknown Recipient',
      subject: headers['Subject'] || 'No Subject',
      date: headers['Date'] || 'Unknown Date',
      body: body || 'Empty message body'
    };
  };

  React.useEffect(() => {
    if (fileContent && (file.name.toLowerCase().endsWith('.eml') || file.mime.includes('message'))) {
      const parsed = parseEMLContent(fileContent);
      setParsedEmail(parsed);
    }
  }, [fileContent, file]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <span className="font-medium">Email Message</span>
      </div>

      {parsedEmail ? (
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Email Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">From:</span>
                    <span className="ml-2 text-gray-900">{parsedEmail.from}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">To:</span>
                    <span className="ml-2 text-gray-900">{parsedEmail.to}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Subject:</span>
                    <span className="ml-2 text-gray-900 font-medium">{parsedEmail.subject}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date:</span>
                    <span className="ml-2 text-gray-600">{parsedEmail.date}</span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-800 font-sans">
                    {parsedEmail.body}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Globe className="w-16 h-16 text-blue-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-600 mb-4">Unable to parse email content</p>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Download className="w-4 h-4" />
              Download Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Calendar Files Preview (ICS, VCS, etc.)
export function CalendarPreview({ file, fileContent, onDownload }: SpecializedPreviewProps) {
  const [events, setEvents] = useState<any[]>([]);

  const parseICSContent = (content: string) => {
    const lines = content.split('\n').map(line => line.trim());
    const events = [];
    let currentEvent: any = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        switch (key) {
          case 'SUMMARY':
            currentEvent.title = value;
            break;
          case 'DTSTART':
            currentEvent.start = formatICSDate(value);
            break;
          case 'DTEND':
            currentEvent.end = formatICSDate(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = value.replace(/\\n/g, '\n');
            break;
          case 'LOCATION':
            currentEvent.location = value;
            break;
          case 'ORGANIZER':
            currentEvent.organizer = value.replace('mailto:', '');
            break;
        }
      }
    }

    return events;
  };

  const formatICSDate = (icsDate: string) => {
    try {
      // Handle basic YYYYMMDDTHHMMSS format
      if (icsDate.length >= 8) {
        const year = icsDate.substring(0, 4);
        const month = icsDate.substring(4, 6);
        const day = icsDate.substring(6, 8);
        const hour = icsDate.substring(9, 11) || '00';
        const minute = icsDate.substring(11, 13) || '00';

        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        return date.toLocaleString();
      }
      return icsDate;
    } catch {
      return icsDate;
    }
  };

  React.useEffect(() => {
    if (fileContent && (file.name.toLowerCase().endsWith('.ics') || file.name.toLowerCase().endsWith('.vcs'))) {
      const parsedEvents = parseICSContent(fileContent);
      setEvents(parsedEvents);
    }
  }, [fileContent, file]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-green-600" />
        </div>
        <span className="font-medium">Calendar Events</span>
        {events.length > 0 && (
          <span className="text-sm text-gray-500">({events.length} events)</span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {events.length > 0 ? (
          <div className="p-6 space-y-4">
            {events.map((event, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.title || 'Untitled Event'}
                  </h3>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {event.start && (
                    <div>
                      <span className="font-medium text-gray-700">Start:</span>
                      <span className="ml-2 text-gray-600">{event.start}</span>
                    </div>
                  )}
                  {event.end && (
                    <div>
                      <span className="font-medium text-gray-700">End:</span>
                      <span className="ml-2 text-gray-600">{event.end}</span>
                    </div>
                  )}
                  {event.location && (
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="ml-2 text-gray-600">{event.location}</span>
                    </div>
                  )}
                  {event.organizer && (
                    <div>
                      <span className="font-medium text-gray-700">Organizer:</span>
                      <span className="ml-2 text-gray-600">{event.organizer}</span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-700">Description:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-600">
                        {event.description}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-green-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 mb-4">No calendar events found</p>
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Download className="w-4 h-4" />
                Download Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
