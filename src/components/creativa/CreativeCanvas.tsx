import React, { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft,
  Mic,
  FileText,
  Lightbulb,
  Image as ImageIcon,
  Upload,
  Trash2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type {
  CreativeNodeData,
  CreativeNodeType,
  CreativeProject,
} from '../../types/database';
import { useStorageFile, useStorageUploader } from '../../hooks/useStorageFile';
import { BrutalistAudioPlayer } from '../ui/BrutalistAudioPlayer';

const AudioNodeComponent: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as CreativeNodeData & {
    onUploadAudio?: (nodeId: string, file: File) => void;
    onDeleteNode?: (nodeId: string) => void;
  };

  return (
    <div className="w-64 bg-[#39FF14] text-black border-2 border-white shadow-[4px_4px_0px_#FFFFFF] p-3 space-y-2">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono-brutal font-extrabold uppercase">
          <Mic className="w-3.5 h-3.5" /> AUDIO / MAQUETA
        </span>
        <button
          onClick={() => nodeData.onDeleteNode?.(id)}
          className="nodrag nopan p-0.5 hover:bg-black hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {nodeData.filePath ? (
        <BrutalistAudioPlayer
          storagePath={nodeData.filePath}
          label={nodeData.fileName || 'Grabación'}
        />
      ) : (
        <label className="nodrag nopan w-full py-3 bg-white border-2 border-black flex flex-col items-center justify-center gap-1 cursor-pointer text-xs font-extrabold">
          <Upload className="w-4 h-4" />
          <span>Subir Audio (.m4a/.mp3)</span>
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) nodeData.onUploadAudio?.(id, f);
            }}
          />
        </label>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const LyricsNodeComponent: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as CreativeNodeData & {
    onChangeContent?: (nodeId: string, content: string) => void;
    onDeleteNode?: (nodeId: string) => void;
  };

  return (
    <div className="w-64 bg-white text-black border-2 border-white shadow-[4px_4px_0px_#39FF14] p-3 space-y-2">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono-brutal font-extrabold uppercase">
          <FileText className="w-3.5 h-3.5" /> LETRA / ESTRUCTURA
        </span>
        <button
          onClick={() => nodeData.onDeleteNode?.(id)}
          className="nodrag nopan p-0.5 hover:bg-black hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        rows={5}
        defaultValue={nodeData.content || ''}
        onChange={(e) => nodeData.onChangeContent?.(id, e.target.value)}
        placeholder="Estrofa, estribillo..."
        className="nodrag nopan w-full p-2 border-2 border-black text-sm font-medium resize-none focus:outline-none bg-neutral-50"
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const IdeaNodeComponent: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as CreativeNodeData & {
    onChangeContent?: (nodeId: string, content: string) => void;
    onDeleteNode?: (nodeId: string) => void;
  };

  return (
    <div className="w-56 bg-[#FF10F0] text-black border-2 border-white shadow-[4px_4px_0px_#FFFFFF] p-3 space-y-2">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono-brutal font-extrabold uppercase">
          <Lightbulb className="w-3.5 h-3.5" /> IDEA RÁPIDA
        </span>
        <button
          onClick={() => nodeData.onDeleteNode?.(id)}
          className="nodrag nopan p-0.5 hover:bg-black hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        rows={3}
        defaultValue={nodeData.content || ''}
        onChange={(e) => nodeData.onChangeContent?.(id, e.target.value)}
        placeholder="Arreglo, melodía..."
        className="nodrag nopan w-full p-2 border-2 border-black text-sm font-bold bg-white resize-none focus:outline-none"
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const ImageNodeComponent: React.FC<NodeProps> = ({ id, data }) => {
  const nodeData = data as CreativeNodeData & {
    onUploadImage?: (nodeId: string, file: File) => void;
    onDeleteNode?: (nodeId: string) => void;
  };
  const { signedUrl } = useStorageFile(nodeData.filePath);

  return (
    <div className="w-60 bg-[#FF5F1F] text-black border-2 border-white shadow-[4px_4px_0px_#FFFFFF] p-3 space-y-2">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between border-b-2 border-black pb-1">
        <span className="inline-flex items-center gap-1 text-[11px] font-mono-brutal font-extrabold uppercase">
          <ImageIcon className="w-3.5 h-3.5" /> IMAGEN / DIBUJO
        </span>
        <button
          onClick={() => nodeData.onDeleteNode?.(id)}
          className="nodrag nopan p-0.5 hover:bg-black hover:text-white"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {signedUrl ? (
        <img
          src={signedUrl}
          alt={nodeData.fileName || 'Boceto'}
          className="w-full h-40 object-cover border-2 border-black bg-white"
        />
      ) : (
        <label className="nodrag nopan w-full py-4 bg-white border-2 border-black flex flex-col items-center justify-center gap-1 cursor-pointer text-xs font-extrabold">
          <Upload className="w-4 h-4" />
          <span>Subir Dibujo / Portada</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) nodeData.onUploadImage?.(id, f);
            }}
          />
        </label>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  audioNode: AudioNodeComponent,
  lyricsNode: LyricsNodeComponent,
  ideaNode: IdeaNodeComponent,
  imageNode: ImageNodeComponent,
};

interface CanvasProps {
  userId: string;
  syncTick: number;
  project: CreativeProject;
  accentColor: string;
  onBack: () => void;
}

export const CreativeCanvas: React.FC<CanvasProps> = ({
  userId,
  syncTick,
  project,
  accentColor,
  onBack,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { uploadFile } = useStorageUploader(userId);
  const saveTimers = useRef<Record<string, number>>({});

  const persistNodeData = useCallback(
    (
      nodeId: string,
      patchData: Partial<CreativeNodeData>,
      immediate = false
    ) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const nextData = { ...n.data, ...patchData };
          const {
            onChangeContent,
            onUploadAudio,
            onUploadImage,
            onDeleteNode,
            ...clean
          } = nextData as Record<string, unknown>;

          if (saveTimers.current[nodeId])
            window.clearTimeout(saveTimers.current[nodeId]);

          const writeToSupabase = () => {
            supabase
              .from('creative_nodes')
              .update({ data: clean })
              .eq('id', nodeId)
              .then();
          };

          if (immediate) {
            writeToSupabase();
          } else {
            saveTimers.current[nodeId] = window.setTimeout(
              writeToSupabase,
              450
            );
          }

          return { ...n, data: nextData };
        })
      );
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      await supabase.from('creative_nodes').delete().eq('id', nodeId);
    },
    [setNodes, setEdges]
  );

  const handleUploadNodeFile = useCallback(
    async (nodeId: string, file: File) => {
      const path = await uploadFile(file, 'creativa');
      if (!path) return;
      persistNodeData(nodeId, { filePath: path, fileName: file.name }, true);
    },
    [uploadFile, persistNodeData]
  );

  const attachCallbacks = useCallback(
    (rawData: CreativeNodeData) => ({
      ...rawData,
      onChangeContent: (id: string, content: string) =>
        persistNodeData(id, { content }, false),
      onUploadAudio: handleUploadNodeFile,
      onUploadImage: handleUploadNodeFile,
      onDeleteNode: handleDeleteNode,
    }),
    [persistNodeData, handleUploadNodeFile, handleDeleteNode]
  );

  useEffect(() => {
    Promise.all([
      supabase.from('creative_nodes').select('*').eq('project_id', project.id),
      supabase.from('creative_edges').select('*').eq('project_id', project.id),
    ]).then(([nRes, eRes]) => {
      if (nRes.data) {
        setNodes(
          nRes.data.map((row) => ({
            id: row.id,
            type: row.node_type,
            position: { x: row.pos_x, y: row.pos_y },
            data: attachCallbacks(row.data as CreativeNodeData),
          }))
        );
      }
      if (eRes.data) {
        setEdges(
          eRes.data.map((row) => ({
            id: row.id,
            source: row.source,
            target: row.target,
            sourceHandle: row.source_handle,
            targetHandle: row.target_handle,
          }))
        );
      }
    });
  }, [project.id, syncTick, setNodes, setEdges, attachCallbacks]);

  const handleAddNode = async (type: CreativeNodeType) => {
    const id = `node_${crypto.randomUUID()}`;
    const pos_x = 60 + Math.round(Math.random() * 140);
    const pos_y = 80 + Math.round(Math.random() * 140);

    const newNode: Node = {
      id,
      type,
      position: { x: pos_x, y: pos_y },
      data: attachCallbacks({}),
    };

    setNodes((nds) => [...nds, newNode]);
    await supabase.from('creative_nodes').insert({
      id,
      user_id: userId,
      project_id: project.id,
      node_type: type,
      pos_x,
      pos_y,
      data: {},
    });
  };

  const handleNodeDragStop = async (_event: any, node: Node) => {
    await supabase
      .from('creative_nodes')
      .update({ pos_x: node.position.x, pos_y: node.position.y })
      .eq('id', node.id);
  };

  const handleConnect = async (connection: Connection) => {
    if (!connection.source || !connection.target) return;
    const edgeId = `edge_${crypto.randomUUID()}`;
    const newEdge: Edge = {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    setEdges((eds) => addEdge(newEdge, eds));

    await supabase.from('creative_edges').insert({
      id: edgeId,
      user_id: userId,
      project_id: project.id,
      source: connection.source,
      target: connection.target,
      source_handle: connection.sourceHandle,
      target_handle: connection.targetHandle,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black text-white">
      <div className="pt-safe pb-2.5 bg-black border-b-2 border-white">
        <div className="max-w-[1100px] mx-auto px-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-white text-black border-2 border-white text-xs font-extrabold uppercase inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Proyectos
          </button>
          <span className="font-extrabold text-sm truncate px-3 text-white">
            {project.title}
          </span>
          <span
            style={{ backgroundColor: accentColor }}
            className="text-[10px] font-mono-brutal font-extrabold px-2 py-0.5 text-black"
          >
            CLOUD SYNC
          </span>
        </div>
      </div>

      <div className="flex-1 w-full bg-black touch-none">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          fitView
          panOnDrag
          zoomOnPinch
          minZoom={0.25}
          maxZoom={2}
        >
          <Background color="#333333" gap={24} size={1.5} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="pb-safe px-4 pt-2.5 bg-black border-t-2 border-white">
        <div className="grid grid-cols-4 gap-2 max-w-[1100px] mx-auto">
          <button
            onClick={() => handleAddNode('audioNode')}
            className="py-2.5 bg-[#39FF14] text-black border-2 border-white shadow-[2px_2px_0px_#FFFFFF] neo-press flex flex-col items-center text-[11px] font-extrabold uppercase"
          >
            <Mic className="w-4 h-4 mb-0.5" /> Audio
          </button>
          <button
            onClick={() => handleAddNode('lyricsNode')}
            className="py-2.5 bg-white text-black border-2 border-white shadow-[2px_2px_0px_#39FF14] neo-press flex flex-col items-center text-[11px] font-extrabold uppercase"
          >
            <FileText className="w-4 h-4 mb-0.5" /> Letra
          </button>
          <button
            onClick={() => handleAddNode('ideaNode')}
            className="py-2.5 bg-[#FF10F0] text-black border-2 border-white shadow-[2px_2px_0px_#FFFFFF] neo-press flex flex-col items-center text-[11px] font-extrabold uppercase"
          >
            <Lightbulb className="w-4 h-4 mb-0.5" /> Idea
          </button>
          <button
            onClick={() => handleAddNode('imageNode')}
            className="py-2.5 bg-[#FF5F1F] text-black border-2 border-white shadow-[2px_2px_0px_#FFFFFF] neo-press flex flex-col items-center text-[11px] font-extrabold uppercase"
          >
            <ImageIcon className="w-4 h-4 mb-0.5" /> Dibujo
          </button>
        </div>
      </div>
    </div>
  );
};
