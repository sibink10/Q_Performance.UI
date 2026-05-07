// @ts-nocheck
// Routes `review-forms` (list) vs `review-forms/:formId` (create/edit) entry — UI lives in subcomponents.

import { useParams } from 'react-router-dom';
import ReviewFormEditor from './review-forms/ReviewFormEditor';
import ReviewFormsList from './review-forms/ReviewFormsList';

const ReviewFormDesign = () => {
  const { formId } = useParams();
  const isFormMode = !!formId;

  if (!isFormMode) {
    return <ReviewFormsList />;
  }

  return <ReviewFormEditor />;
};

export default ReviewFormDesign;
