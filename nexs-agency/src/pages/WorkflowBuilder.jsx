import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workflowAPI } from '../services/api';

// Node type configurations
const nodeTypeConfig = {
    // Triggers
    lead_created: { label: 'Lead Created', color: 'bg-blue-500', category: 'trigger' },
    client_created: { label: 'Client Created', color: 'bg-blue-500', category: 'trigger' },
    lead_status_changed: { label: 'Lead Status Changed', color: 'bg-blue-500', category: 'trigger' },
    scheduled: { label: 'Scheduled', color: 'bg-purple-500', category: 'trigger' },
    manual: { label: 'Manual Trigger', color: 'bg-gray-500', category: 'trigger' },
    // Actions
    send_email: { label: 'Send Email', color: 'bg-green-500', category: 'action' },
    update_lead: { label: 'Update Lead', color: 'bg-green-500', category: 'action' },
    update_client: { label: 'Update Client', color: 'bg-green-500', category: 'action' },
    create_task: { label: 'Create Task', color: 'bg-green-500', category: 'action' },
    assign_user: { label: 'Assign User', color: 'bg-green-500', category: 'action' },
    add_note: { label: 'Add Note', color: 'bg-green-500', category: 'action' },
    send_notification: { label: 'Send Notification', color: 'bg-green-500', category: 'action' },
    webhook: { label: 'Webhook', color: 'bg-orange-500', category: 'action' },
    // Logic
    condition: { label: 'If/Else', color: 'bg-yellow-500', category: 'condition' },
    delay: { label: 'Delay', color: 'bg-gray-500', category: 'delay' }
};

// Draggable Node Component
function WorkflowNode({ node, isSelected, onClick, onDragStart, onDragEnd, onConnectStart, connecting }) {
    const config = nodeTypeConfig[node.action_type || node.node_type] || { label: node.label || 'Node', color: 'bg-gray-400' };

    return (
        <div
            className={`absolute cursor-move transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 z-20' : 'z-10'}`}
            style={{ left: node.position_x, top: node.position_y }}
            onClick={onClick}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            <div className="w-40 bg-white rounded-lg shadow-lg overflow-hidden border">
                <div className={`${config.color} px-3 py-2 text-white text-sm font-medium flex items-center gap-2`}>
                    <i className={`ri-${node.node_type === 'trigger' ? 'flashlight' : node.node_type === 'action' ? 'play' : node.node_type === 'condition' ? 'git-branch' : 'time'}-line`}></i>
                    {config.label}
                </div>
                <div className="p-2 text-xs text-gray-500">
                    {node.label || 'Click to configure'}
                </div>
            </div>
            {/* Connection handles */}
            {node.node_type !== 'trigger' && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-300 border-2 border-white shadow cursor-pointer hover:bg-blue-400" />
            )}
            <div
                className={`absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow cursor-crosshair ${connecting === node.id ? 'bg-blue-500' : 'bg-blue-400 hover:bg-blue-500'}`}
                onClick={(e) => { e.stopPropagation(); onConnectStart(node.id); }}
            />
        </div>
    );
}

export default function WorkflowBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [workflow, setWorkflow] = useState(null);
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dragging, setDragging] = useState(null);
    const [connecting, setConnecting] = useState(null);
    const [executions, setExecutions] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        fetchWorkflow();
    }, [id]);

    const fetchWorkflow = async () => {
        try {
            const res = await workflowAPI.getById(id);
            const data = res.data?.data || res.data;
            setWorkflow(data);
            setNodes(data.nodes || []);
            setConnections(data.connections || []);

            // Add trigger node if none exist
            if (!data.nodes?.length && data.trigger_type) {
                setNodes([{
                    id: 'trigger-1',
                    node_uid: 'trigger-1',
                    node_type: 'trigger',
                    action_type: data.trigger_type,
                    label: nodeTypeConfig[data.trigger_type]?.label || 'Trigger',
                    position_x: 100,
                    position_y: 150,
                    config: {}
                }]);
            }

            // Fetch executions
            const execRes = await workflowAPI.getExecutions(id, 10);
            setExecutions(execRes.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch workflow:', error);
            alert('Failed to load workflow');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await workflowAPI.update(id, {
                nodes: nodes.map(n => ({
                    node_uid: n.node_uid || n.id,
                    node_type: n.node_type,
                    action_type: n.action_type,
                    label: n.label,
                    config: n.config,
                    position_x: n.position_x,
                    position_y: n.position_y
                })),
                connections: connections.map(c => ({
                    source: c.source_node_id || c.source,
                    target: c.target_node_id || c.target,
                    sourceHandle: c.source_handle || 'default'
                }))
            });
            alert('Workflow saved!');
        } catch (error) {
            alert('Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    const handleRun = async () => {
        try {
            await workflowAPI.run(id);
            alert('Workflow started!');
            setTimeout(() => fetchWorkflow(), 2000);
        } catch (error) {
            alert('Failed to run workflow');
        }
    };

    const addNode = (type, nodeType) => {
        const config = nodeTypeConfig[type];
        const newNode = {
            id: `${type}-${Date.now()}`,
            node_uid: `${type}-${Date.now()}`,
            node_type: nodeType,
            action_type: type,
            label: config?.label || type,
            position_x: 250 + Math.random() * 50,
            position_y: 100 + nodes.length * 80,
            config: {}
        };
        setNodes([...nodes, newNode]);
    };

    const deleteNode = (nodeId) => {
        setNodes(nodes.filter(n => (n.id || n.node_uid) !== nodeId));
        setConnections(connections.filter(c =>
            (c.source_node_id || c.source) !== nodeId &&
            (c.target_node_id || c.target) !== nodeId
        ));
        if (selectedNode?.id === nodeId || selectedNode?.node_uid === nodeId) {
            setSelectedNode(null);
        }
    };

    const handleNodeDrag = useCallback((nodeId, deltaX, deltaY) => {
        setNodes(prev => prev.map(n =>
            (n.id === nodeId || n.node_uid === nodeId)
                ? { ...n, position_x: n.position_x + deltaX, position_y: n.position_y + deltaY }
                : n
        ));
    }, []);

    const handleConnect = (sourceId, targetId) => {
        if (!targetId || sourceId === targetId) {
            setConnecting(null);
            return;
        }
        const exists = connections.some(c =>
            (c.source_node_id || c.source) === sourceId &&
            (c.target_node_id || c.target) === targetId
        );
        if (!exists) {
            setConnections([...connections, {
                id: `conn-${Date.now()}`,
                source: sourceId,
                target: targetId,
                source_handle: 'default'
            }]);
        }
        setConnecting(null);
    };

    const updateNodeConfig = (nodeId, config) => {
        setNodes(nodes.map(n =>
            (n.id === nodeId || n.node_uid === nodeId)
                ? { ...n, config: { ...(n.config || {}), ...config } }
                : n
        ));
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/workflows')} className="p-2 hover:bg-gray-100 rounded-lg">
                        <i className="ri-arrow-left-line text-xl text-gray-600"></i>
                    </button>
                    <div>
                        <h1 className="font-semibold text-gray-900">{workflow?.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full ${workflow?.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {workflow?.is_active ? 'Active' : 'Inactive'}
                            <span className="mx-1">|</span>
                            {nodes.length} nodes
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowLogs(!showLogs)} className={`px-3 py-2 rounded-lg text-sm ${showLogs ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
                        <i className="ri-file-list-line mr-1"></i>
                        Logs
                    </button>
                    <button onClick={handleRun} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                        <i className="ri-play-fill mr-1"></i>
                        Test Run
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm" disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Node Palette */}
                <div className="w-56 bg-white border-r flex flex-col">
                    <div className="p-3 border-b">
                        <h3 className="font-medium text-gray-700 text-sm">Add Node</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-4">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Actions</h4>
                            <div className="space-y-1">
                                {['send_email', 'update_lead', 'create_task', 'assign_user', 'add_note', 'send_notification', 'webhook'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => addNode(type, 'action')}
                                        className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        {nodeTypeConfig[type]?.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Logic</h4>
                            <div className="space-y-1">
                                <button onClick={() => addNode('condition', 'condition')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    If/Else Condition
                                </button>
                                <button onClick={() => addNode('delay', 'delay')} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                    Delay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative overflow-hidden" ref={canvasRef}>
                    {connecting && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow-lg">
                            Click another node to connect
                        </div>
                    )}
                    <div
                        className="w-full h-full overflow-auto"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                        onClick={() => { setConnecting(null); setSelectedNode(null); }}
                    >
                        <div style={{ minWidth: '2000px', minHeight: '1500px', position: 'relative' }}>
                            {/* Connections SVG */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                {connections.map(conn => {
                                    const source = nodes.find(n => (n.id || n.node_uid) === (conn.source_node_id || conn.source));
                                    const target = nodes.find(n => (n.id || n.node_uid) === (conn.target_node_id || conn.target));
                                    if (!source || !target) return null;

                                    const x1 = source.position_x + 160;
                                    const y1 = source.position_y + 35;
                                    const x2 = target.position_x;
                                    const y2 = target.position_y + 35;
                                    const controlOffset = Math.min(Math.abs(x2 - x1) / 2, 100);

                                    return (
                                        <g key={conn.id} className="pointer-events-auto cursor-pointer" onClick={() => setConnections(connections.filter(c => c.id !== conn.id))}>
                                            <path
                                                d={`M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`}
                                                stroke="#3b82f6"
                                                strokeWidth="2"
                                                fill="none"
                                                className="hover:stroke-red-500"
                                            />
                                        </g>
                                    );
                                })}
                            </svg>

                            {/* Nodes */}
                            {nodes.map(node => (
                                <WorkflowNode
                                    key={node.id || node.node_uid}
                                    node={node}
                                    isSelected={(selectedNode?.id || selectedNode?.node_uid) === (node.id || node.node_uid)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedNode(node); }}
                                    onDragStart={(e) => setDragging({ nodeId: node.id || node.node_uid, startX: e.clientX, startY: e.clientY })}
                                    onDragEnd={(e) => {
                                        if (dragging) {
                                            handleNodeDrag(node.id || node.node_uid, e.clientX - dragging.startX, e.clientY - dragging.startY);
                                            setDragging(null);
                                        }
                                    }}
                                    onConnectStart={(nodeId) => {
                                        if (connecting && connecting !== nodeId) {
                                            handleConnect(connecting, nodeId);
                                        } else {
                                            setConnecting(nodeId);
                                        }
                                    }}
                                    connecting={connecting}
                                />
                            ))}

                            {nodes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                                        <i className="ri-flow-chart text-5xl text-gray-300 mb-4"></i>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Building</h3>
                                        <p className="text-gray-500">Add nodes from the left panel</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Config Panel */}
                {selectedNode && !showLogs && (
                    <div className="w-72 bg-white border-l flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Configure Node</h3>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-gray-600">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={selectedNode.label || ''}
                                    onChange={(e) => {
                                        setNodes(nodes.map(n => (n.id || n.node_uid) === (selectedNode.id || selectedNode.node_uid) ? { ...n, label: e.target.value } : n));
                                        setSelectedNode({ ...selectedNode, label: e.target.value });
                                    }}
                                />
                            </div>

                            {/* Email config */}
                            {selectedNode.action_type === 'send_email' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="Welcome {{contact_name}}!"
                                            value={selectedNode.config?.subject || ''}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Body (HTML)</label>
                                        <textarea
                                            className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                                            rows={6}
                                            placeholder="<p>Hello {{contact_name}},</p>"
                                            value={selectedNode.config?.body || ''}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { body: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Delay config */}
                            {selectedNode.action_type === 'delay' && (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Wait</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={selectedNode.config?.value || ''}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { value: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={selectedNode.config?.unit || 'minutes'}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { unit: e.target.value })}
                                        >
                                            <option value="minutes">Minutes</option>
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Condition config */}
                            {selectedNode.action_type === 'condition' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            placeholder="status"
                                            value={selectedNode.config?.field || ''}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { field: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                                        <select
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={selectedNode.config?.operator || 'equals'}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { operator: e.target.value })}
                                        >
                                            <option value="equals">Equals</option>
                                            <option value="not_equals">Not Equals</option>
                                            <option value="contains">Contains</option>
                                            <option value="greater_than">Greater Than</option>
                                            <option value="less_than">Less Than</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg px-3 py-2 text-sm"
                                            value={selectedNode.config?.value || ''}
                                            onChange={(e) => updateNodeConfig(selectedNode.id || selectedNode.node_uid, { value: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="p-4 border-t">
                            <button
                                onClick={() => deleteNode(selectedNode.id || selectedNode.node_uid)}
                                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                            >
                                <i className="ri-delete-bin-line mr-1"></i>
                                Delete Node
                            </button>
                        </div>
                    </div>
                )}

                {/* Logs Panel */}
                {showLogs && (
                    <div className="w-72 bg-white border-l flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Execution Logs</h3>
                            <button onClick={() => setShowLogs(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {executions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">No executions yet</div>
                            ) : (
                                executions.map(exec => (
                                    <div key={exec.id} className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${exec.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    exec.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>{exec.status}</span>
                                            <span className="text-xs text-gray-400">{new Date(exec.started_at).toLocaleTimeString()}</span>
                                        </div>
                                        {exec.error_message && (
                                            <p className="text-xs text-red-500 mt-1 truncate">{exec.error_message}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
