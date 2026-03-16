import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';

const VideoPlayer = ({ movieId }) => {
    const [active, setActive] = useState(false);

    useEffect(() => { setActive(false); }, [movieId]);

    if (!movieId) return null;

    const iframeSrc = `https://vidlink.pro/movie/${movieId}?primaryColor=c45454&secondaryColor=a2a2a2&iconColor=eefdec&poster=true&title=true&nextbutton=false`;

    return (
        <div className="relative w-full h-full">
            <iframe
                src={iframeSrc}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media;"
                allowFullScreen
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                title="Movie Stream"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full border-0"
                style={{ userSelect: 'none' }}
            />
        </div>
    );
};


VideoPlayer.propTypes = {
    movieId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
};

export default memo(VideoPlayer);