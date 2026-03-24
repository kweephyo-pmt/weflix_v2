import { memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ movieId }) => {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        setShouldRender(false);
        const timer = setTimeout(() => setShouldRender(true), 150);
        return () => clearTimeout(timer);
    }, [movieId]);

    if (!movieId) return null;

    const iframeSrc = `https://vidlink.pro/movie/${movieId}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false&player=jw`;

    return (
        <div className="relative w-full h-full bg-black">
            {shouldRender && (
                <iframe
                    key={iframeSrc}
                    src={iframeSrc}
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                    allowFullScreen
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                    title="Movie Stream"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full border-0"
                    style={{ userSelect: 'none' }}
                />
            )}
        </div>
    );
};


VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
};

export default memo(VideoPlayer);