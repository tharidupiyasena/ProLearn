import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../../common/Navbar';
import { useToast } from '../../common/Toast';
import { API_BASE_URL } from '../../../config/apiConfig';

const EditLearningPlan = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { id } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resources: [],
    weeks: [],
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const resourceTypes = ['Video', 'Documentation', 'Article', 'Tutorial', 'Book'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/auth');
            return;
          }
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        setCurrentUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        addToast('Failed to load user data.', 'error');
      }
    };

    const fetchLearningPlan = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/learning-plan/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch learning plan');
        }

        const data = await response.json();
        setFormData({
          title: data.title || '',
          description: data.description || '',
          resources: data.resources && Array.isArray(data.resources) && data.resources.length > 0
            ? data.resources
            : [{ title: '', url: '', type: 'Video' }],
          weeks: data.weeks && Array.isArray(data.weeks) && data.weeks.length > 0
            ? data.weeks
            : [{ title: '', description: '', status: 'Not Started' }],
        });
      } catch (error) {
        console.error('Error fetching learning plan:', error);
        addToast('Failed to load learning plan.', 'error');
        navigate('/learning-plans/my-plans');
      }
    };

    fetchCurrentUser().then(fetchLearningPlan).finally(() => setIsLoading(false));
  }, [navigate, addToast, id]);

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title cannot exceed 255 characters';
    }

    // Description validation (optional, but if provided, must meet criteria)
    if (formData.description) {
      if (formData.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters long if provided';
      } else if (formData.description.length > 1000) {
        newErrors.description = 'Description cannot exceed 1000 characters';
      }
    }

    // Resources validation
    if (formData.resources.length === 0) {
      newErrors.resources = 'At least one resource is required';
    } else {
      formData.resources.forEach((resource, index) => {
        // Resource Title
        if (!resource.title.trim()) {
          newErrors[`resourceTitle${index}`] = 'Resource title is required';
        } else if (resource.title.length < 3) {
          newErrors[`resourceTitle${index}`] = 'Resource title must be at least 3 characters long';
        } else if (resource.title.length > 100) {
          newErrors[`resourceTitle${index}`] = 'Resource title cannot exceed 100 characters';
        }

        // Resource URL
        if (!resource.url.trim()) {
          newErrors[`resourceUrl${index}`] = 'Resource URL is required';
        } else if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(resource.url)) {
          newErrors[`resourceUrl${index}`] = 'Invalid URL format (must start with http:// or https://)';
        } else if (resource.url.length > 2048) {
          newErrors[`resourceUrl${index}`] = 'URL cannot exceed 2048 characters';
        }

        // Resource Type
        if (!resource.type) {
          newErrors[`resourceType${index}`] = 'Resource type is required';
        } else if (!resourceTypes.includes(resource.type)) {
          newErrors[`resourceType${index}`] = 'Invalid resource type';
        }
      });
    }

    // Weeks validation
    if (formData.weeks.length === 0) {
      newErrors.weeks = 'At least one week is required';
    } else {
      formData.weeks.forEach((week, index) => {
        // Week Title
        if (!week.title.trim()) {
          newErrors[`weekTitle${index}`] = 'Week title is required';
        } else if (week.title.length < 3) {
          newErrors[`weekTitle${index}`] = 'Week title must be at least 3 characters long';
        } else if (week.title.length > 100) {
          newErrors[`weekTitle${index}`] = 'Week title cannot exceed 100 characters';
        }

        // Week Description (optional, but if provided, must meet criteria)
        if (week.description) {
          if (week.description.length < 10) {
            newErrors[`weekDescription${index}`] = 'Week description must be at least 10 characters long if provided';
          } else if (week.description.length > 500) {
            newErrors[`weekDescription${index}`] = 'Week description cannot exceed 500 characters';
          }
        }

        // Week Status
        if (!week.status) {
          newErrors[`weekStatus${index}`] = 'Week status is required';
        } else if (!['Not Started', 'In Progress', 'Completed'].includes(week.status)) {
          newErrors[`weekStatus${index}`] = 'Invalid week status';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e, section, index, field) => {
    const { value } = e.target;
    const fieldKey = section ? `${section}${field}${index}` : e.target.name;

    // Update form data
    if (section) {
      const updatedSection = [...formData[section]];
      updatedSection[index] = { ...updatedSection[index], [field]: value };
      setFormData({ ...formData, [section]: updatedSection });
    } else {
      setFormData({ ...formData, [e.target.name]: value });
    }

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));

    // Clear error for this field and revalidate
    setErrors((prev) => ({ ...prev, [fieldKey]: '' }));
    validateForm();
  };

  const handleBlur = (section, index, field) => {
    const fieldKey = section ? `${section}${field}${index}` : field;
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));
    validateForm();
  };

  const addResource = () => {
    setFormData({
      ...formData,
      resources: [...formData.resources, { title: '', url: '', type: 'Video' }],
    });
    setTouched((prev) => ({
      ...prev,
      [`resourceTitle${formData.resources.length}`]: false,
      [`resourceUrl${formData.resources.length}`]: false,
      [`resourceType${formData.resources.length}`]: false,
    }));
  };

  const removeResource = (index) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((_, i) => i !== index),
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`resourceTitle${index}`];
      delete newErrors[`resourceUrl${index}`];
      delete newErrors[`resourceType${index}`];
      return newErrors;
    });
    setTouched((prev) => {
      const newTouched = { ...prev };
      delete newTouched[`resourceTitle${index}`];
      delete newTouched[`resourceUrl${index}`];
      delete newTouched[`resourceType${index}`];
      return newTouched;
    });
    validateForm();
  };

  const addWeek = () => {
    setFormData({
      ...formData,
      weeks: [...formData.weeks, { title: '', description: '', status: 'Not Started' }],
    });
    setTouched((prev) => ({
      ...prev,
      [`weekTitle${formData.weeks.length}`]: false,
      [`weekDescription${formData.weeks.length}`]: false,
      [`weekStatus${formData.weeks.length}`]: false,
    }));
  };

  const removeWeek = (index) => {
    setFormData({
      ...formData,
      weeks: formData.weeks.filter((_, i) => i !== index),
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`weekTitle${index}`];
      delete newErrors[`weekDescription${index}`];
      delete newErrors[`weekStatus${index}`];
      return newErrors;
    });
    setTouched((prev) => {
      const newTouched = { ...prev };
      delete newTouched[`weekTitle${index}`];
      delete newTouched[`weekDescription${index}`];
      delete newTouched[`weekStatus${index}`];
      return newTouched;
    });
    validateForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (!validateForm()) {
      addToast('Please fix the errors in the form.', 'error');
      return;
    }

    if (!window.confirm('Are you sure you want to update this learning plan?')) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/learning-plan/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          resources: formData.resources,
          weeks: formData.weeks,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Failed to update learning plan';
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      addToast('Learning plan updated successfully!', 'success');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating learning plan:', error);
      addToast(error.message || 'Failed to update learning plan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to discard changes?')) {
      navigate('/learning-plans/my-plans');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar user={currentUser} />
      <div className="max-w-4xl mx-auto pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Edit Learning Plan</h1>
          <button
            onClick={() => navigate('/learning-plans/my-plans')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Plans
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={(e) => handleInputChange(e)}
              onBlur={() => handleBlur(null, null, 'title')}
              className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                (touched.title || hasAttemptedSubmit) && errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter plan title"
              required
            />
            {(touched.title || hasAttemptedSubmit) && errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) => handleInputChange(e)}
              onBlur={() => handleBlur(null, null, 'description')}
              className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                (touched.description || hasAttemptedSubmit) && errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="What do you want to achieve with this learning plan?"
              rows="4"
            />
            {(touched.description || hasAttemptedSubmit) && errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Learning Resources</h2>
              <button
                type="button"
                onClick={addResource}
                className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Resource
              </button>
            </div>
            {(touched.resources || hasAttemptedSubmit) && errors.resources && (
              <p className="mb-3 text-sm text-red-600">{errors.resources}</p>
            )}

            <div className="space-y-4">
              {formData.resources.map((resource, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Resource {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeResource(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200 flex items-center"
                      disabled={formData.resources.length === 1}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v8m4-8v8m1-10l-1-1m0 0l-1 1m1-1V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2m11 13h-4.5m-9 0H6"></path>
                      </svg>
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={resource.title}
                        onChange={(e) => handleInputChange(e, 'resources', index, 'title')}
                        onBlur={() => handleBlur('resources', index, 'title')}
                        className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                          (touched[`resourcesTitle${index}`] || hasAttemptedSubmit) && errors[`resourceTitle${index}`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="Resource title"
                        required
                      />
                      {(touched[`resourcesTitle${index}`] || hasAttemptedSubmit) && errors[`resourceTitle${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`resourceTitle${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={resource.type}
                        onChange={(e) => handleInputChange(e, 'resources', index, 'type')}
                        onBlur={() => handleBlur('resources', index, 'type')}
                        className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                          (touched[`resourcesType${index}`] || hasAttemptedSubmit) && errors[`resourceType${index}`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="" disabled>
                          Select type
                        </option>
                        {resourceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      {(touched[`resourcesType${index}`] || hasAttemptedSubmit) && errors[`resourceType${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`resourceType${index}`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(e) => handleInputChange(e, 'resources', index, 'url')}
                      onBlur={() => handleBlur('resources', index, 'url')}
                      className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                        (touched[`resourcesUrl${index}`] || hasAttemptedSubmit) && errors[`resourceUrl${index}`]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="https://example.com"
                      required
                    />
                    {(touched[`resourcesUrl${index}`] || hasAttemptedSubmit) && errors[`resourceUrl${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`resourceUrl${index}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Weekly Timeline</h2>
              <button
                type="button"
                onClick={addWeek}
                className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Week
              </button>
            </div>
            {(touched.weeks || hasAttemptedSubmit) && errors.weeks && (
              <p className="mb-3 text-sm text-red-600">{errors.weeks}</p>
            )}

            <div className="space-y-4">
              {formData.weeks.map((week, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-100 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Week {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeWeek(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors duration-200 flex items-center"
                      disabled={formData.weeks.length === 1}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v8m4-8v8m1-10l-1-1m0 0l-1 1m1-1V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2m11 13h-4.5m-9 0H6"></path>
                      </svg>
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={week.title}
                        onChange={(e) => handleInputChange(e, 'weeks', index, 'title')}
                        onBlur={() => handleBlur('weeks', index, 'title')}
                        className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                          (touched[`weeksTitle${index}`] || hasAttemptedSubmit) && errors[`weekTitle${index}`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="Week title"
                        required
                      />
                      {(touched[`weeksTitle${index}`] || hasAttemptedSubmit) && errors[`weekTitle${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`weekTitle${index}`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={week.status}
                        onChange={(e) => handleInputChange(e, 'weeks', index, 'status')}
                        onBlur={() => handleBlur('weeks', index, 'status')}
                        className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                          (touched[`weeksStatus${index}`] || hasAttemptedSubmit) && errors[`weekStatus${index}`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      {(touched[`weeksStatus${index}`] || hasAttemptedSubmit) && errors[`weekStatus${index}`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`weekStatus${index}`]}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={week.description}
                      onChange={(e) => handleInputChange(e, 'weeks', index, 'description')}
                      onBlur={() => handleBlur('weeks', index, 'description')}
                      className={`block w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ${
                        (touched[`weeksDescription${index}`] || hasAttemptedSubmit) && errors[`weekDescription${index}`]
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="What do you plan to achieve this week?"
                      rows="2"
                    />
                    {(touched[`weeksDescription${index}`] || hasAttemptedSubmit) && errors[`weekDescription${index}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`weekDescription${index}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (hasAttemptedSubmit && hasErrors)}
              className={`px-5 py-2 rounded-lg text-white font-medium flex items-center ${
                isSubmitting || (hasAttemptedSubmit && hasErrors)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Update Learning Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLearningPlan;