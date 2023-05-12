import React from 'react';
import { useQuery } from '@apollo/client';
import { useLocation, useNavigate } from 'react-router-dom';

import Link from './Link';
import { FEED_QUERY, NEW_LINKS_SUBSCRIPTION } from '../queries';
import { LINKS_PER_PAGE } from '../constants';

const LinkList = () => {
  const navigate = useNavigate();

  // GET URL params
  const location = useLocation();
  const isNewPage = location.pathname.includes(
    'new'
  );
  const pageIndexParams = location.pathname.split(
    '/'
  );
  const page = parseInt(
    pageIndexParams[pageIndexParams.length - 1]
  );
  const pageIndex = page ? (page - 1) * LINKS_PER_PAGE : 0;

  // Send url params
  const { data, loading, error, subscribeToMore } = useQuery(FEED_QUERY, {
    variables: {
      take: isNewPage ? LINKS_PER_PAGE : 100,
      skip: isNewPage ? (page - 1) * LINKS_PER_PAGE : 0,
      orderBy: { createdAt: 'desc' }
    }
  });

  // This crashes with cache behavior when you
  // create a new link and it's redirect to here
  subscribeToMore({
    document: NEW_LINKS_SUBSCRIPTION,
    updateQuery: (prev, { subscriptionData }) => {
      if (!subscriptionData.data) return prev;
      const newLink = subscriptionData.data.newLink;
      const exists = prev.feed.links.find(
        ({ id }) => id === newLink.id
      );
      if (exists) return prev;

      return Object.assign({}, prev, {
        feed: {
          ...prev.feed,
          links: [newLink, ...prev.feed.links],
          count: prev.feed.links.length + 1,
        }
      });
    }
  });

  // subscribeToMore({
  //   document: NEW_VOTES_SUBSCRIPTION
  // });

  const getLinksToRender = (isNewPage, data) => {
    if (isNewPage) {
      return data.feed.links;
    }
    const rankedLinks = data.feed.links.slice();
    rankedLinks.sort(
      (l1, l2) => l2.votes.length - l1.votes.length
    );
    return rankedLinks;
  };

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
      {data && (
        <>
          {getLinksToRender(isNewPage, data).map(
            (link, index) => (
              <Link
                key={link.id}
                link={link}
                index={index + pageIndex}
              />
            )
          )}
          {isNewPage && (
            <div className="flex ml4 mv3 gray">
              <div
                className="pointer mr2"
                onClick={() => {
                  if (page > 1) {
                    navigate(`/new/${page - 1}`);
                  }
                }}
              >
                Previous
              </div>
              <div
                className="pointer"
                onClick={() => {
                  if (
                    page <=
                    data.feed.count / LINKS_PER_PAGE
                  ) {
                    const nextPage = page + 1;
                    navigate(`/new/${nextPage}`);
                  }
                }}
              >
                Next
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LinkList;