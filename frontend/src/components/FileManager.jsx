import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Alert, Modal } from 'react-bootstrap';
import { uploadFile, downloadFile, getFiles, deleteFile, shareFile } from '../services/api';
import './FileManager.css';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [userEmailToShare, setUserEmailToShare] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await getFiles();
      setFiles(data);
    } catch (error) {
      setError('Failed to fetch files');
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await uploadFile(formData);
      await fetchFiles();
      setSelectedFile(null);
      e.target.reset();
    } catch (error) {
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await downloadFile(fileId);
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  const handleDelete = async (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await deleteFile(fileId);
        await fetchFiles();  // Refresh the file list
      } catch (error) {
        console.error('Delete error:', error);
        setError('Failed to delete file');
      }
    }
  };

  const handleShare = async (fileId) => {
    setSelectedFileId(fileId);
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    try {
      await shareFile(selectedFileId, userEmailToShare);
      setShowShareModal(false);
      setUserEmailToShare('');
      setError('');
    } catch (error) {
      console.log('Share error:', error.response?.data);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to share file');
      }
    }
  };

  return (
    <Container className="file-manager mt-4">
      <h2 className="file-manager-title">File Manager</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleUpload} className="upload-form mb-4">
        <Form.Group>
          <Form.Label>Upload File</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="file"
              onChange={handleFileSelect}
              className="me-2"
            />
            <Button 
              type="submit" 
              variant="dark" 
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </Form.Group>
      </Form>

      <Table hover className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Uploaded At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(file => (
            <tr key={file.id}>
              <td>{file.original_name}</td>
              <td>{Math.round(file.file_size / 1024)} KB</td>
              <td>{new Date(file.uploaded_at).toLocaleString()}</td>
              <td>
                {file.is_owner && (
                  <div className="d-flex gap-2">
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => handleDownload(file.id)}
                    >
                      Download
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleShare(file.id)}
                    >
                      Share
                    </Button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showShareModal} onHide={() => setShowShareModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Share File</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group>
              <Form.Label>User Email</Form.Label>
              <Form.Control
                type="email"
                value={userEmailToShare}
                onChange={(e) => setUserEmailToShare(e.target.value)}
                placeholder="Enter user email to share with"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowShareModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleShareSubmit}>
            Share
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FileManager; 