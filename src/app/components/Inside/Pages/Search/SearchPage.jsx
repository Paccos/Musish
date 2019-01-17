import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';

import classes from './SearchPage.scss';
import withMK from '../../../../hoc/withMK';
import PageTitle from '../../../Common/PageTitle/PageTitle';
import PageContent from '../../../Common/PageContent/PageContent';
import Loader from '../../../Common/Loader/Loader';
import AlbumItem from '../../../Common/AlbumItem/AlbumItem';
import PlaylistItem from '../../../Common/PlaylistItem/PlaylistItem';
import TracksGrid from '../../../Common/Tracks/TracksGrid/TracksGrid';
import * as MusicPlayerApi from '../../../../services/MusicPlayerApi';
import ArtistItem from '../../../Common/ArtistItem/ArtistItem';
import Tabs from '../../../Common/Tabs/Tabs';
import Tab from '../../../Common/Tabs/Tab';

class SearchPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      results: {
        albums: null,
        songs: null,
        playlists: null,
        artists: null,
      },
      loading: null,
    };

    this.ref = React.createRef();
    this.search = this.search.bind(this);
    this.renderResults = this.renderResults.bind(this);
  }

  componentDidMount() {
    this.search();
  }

  async search() {
    const query = this.props.match.params.query.replace(' ', '+');
    if (query.length === 0) {
      this.setState({
        results: null,
      });
      return;
    }

    this.setState({
      loading: true,
    });

    switch (this.props.match.params.source) {
      case 'catalog':
        await this.searchCatalog(query);
        break;
      case 'library':
        await this.searchLibrary(query);
        break;
      default:
        break;
    }

    this.setState({
      loading: false,
    });
  }

  async searchCatalog(query) {
    const res = await this.props.mk.instance.api.search(query, {
      types: ['albums', 'songs', 'playlists', 'artists'],
      limit: 24,
    });
    const { results } = this.state;
    this.setState({
      results: {
        ...results,
        albums: res.albums ? res.albums.data : [],
        songs: res.songs ? res.songs.data : [],
        playlists: res.playlists ? res.playlists.data : [],
        artists: res.artists ? res.artists.data : [],
      },
    });
  }

  async searchLibrary(query) {
    const res = await this.props.mk.instance.api.library.search(query, {
      types: ['library-albums', 'library-songs', 'library-playlists', 'library-artists'],
      limit: 24,
    });
    const { results } = this.state;
    this.setState({
      results: {
        ...results,
        albums: res['library-albums'] ? res['library-albums'].data : [],
        songs: res['library-songs'] ? res['library-songs'].data : [],
        playlists: res['library-playlists'] ? res['library-playlists'].data : [],
        artists: res['library-artists'] ? res['library-artists'].data : [],
      },
    });
  }

  static playTrack({ tracks, index }) {
    MusicPlayerApi.playTrack(tracks, index);
  }

  renderSongs() {
    const { songs } = this.state.results;

    if (!songs || songs.length === 0) {
      return null;
    }

    return (
      <>
        <h3>Songs</h3>
        <TracksGrid
          scrollElement={this.ref}
          tracks={songs}
          showArtist
          showAlbum
          playTrack={SearchPage.playTrack}
        />
      </>
    );
  }

  renderAlbums() {
    const { albums } = this.state.results;

    if (!albums || albums.length === 0) {
      return null;
    }

    return (
      <>
        <h3>Albums</h3>
        <div className={classes.searchGrid}>
          {albums.map(album => (
            <AlbumItem key={album.id} album={album} size={120} />
          ))}
        </div>
      </>
    );
  }

  renderPlaylists() {
    const { playlists } = this.state.results;

    if (!playlists || playlists.length === 0) {
      return null;
    }

    return (
      <>
        <h3>Playlists</h3>
        <div className={classes.searchGrid}>
          {playlists.map(playlist => (
            <PlaylistItem key={playlist.id} playlist={playlist} size={120} />
          ))}
        </div>
      </>
    );
  }

  renderArtists() {
    const { artists } = this.state.results;

    if (!artists || artists.length === 0) {
      return null;
    }

    return (
      <>
        <h3>Artists</h3>
        <div className={classes.searchArtistsGrid}>
          {artists.slice(0, 12).map(artist => (
            <ArtistItem artist={artist} size={41} key={artist.id} />
          ))}
        </div>
      </>
    );
  }

  renderResults() {
    const { loading } = this.state;

    const songs = this.renderSongs();
    const albums = this.renderAlbums();
    const playlists = this.renderPlaylists();
    const artists = this.renderArtists();

    const isEmpty = !(loading || songs || albums || playlists || artists);

    return (
      <>
        {loading && <Loader />}

        {isEmpty ? (
          <div className={classes.searchError}>
            <span className={classes.searchErrorTitle} role={'img'} aria-label={'loudly-crying'}>
              😭
            </span>
            <span className={classes.searchErrorDetails}>Oops, no results found.</span>
          </div>
        ) : (
          <>
            {songs}
            {artists}
            {albums}
            {playlists}
          </>
        )}
      </>
    );
  }

  render() {
    const { isAuthorized } = this.props.mk.instance;
    const { query } = this.props.match.params;
    return (
      <PageContent innerRef={this.ref}>
        <PageTitle title={`Searching for ${this.props.match.params.query}`} context={'Search'} />

        <Tabs>
          <Tab name={'Apple Music'} route={`/search/catalog/${query}`}>
            {this.renderResults()}
          </Tab>
          <Tab name={'My Library'} route={`/search/library/${query}`}>
            {isAuthorized ? (
              this.renderResults()
            ) : (
              <div className={classes.searchError}>
                <span
                  className={classes.searchErrorTitle}
                  role={'img'}
                  aria-label={'loudly-crying'}
                >
                  😱
                </span>
                <span className={classes.searchErrorDetails}>
                  You must login to search your library.
                </span>
              </div>
            )}
          </Tab>
        </Tabs>
      </PageContent>
    );
  }
}

SearchPage.propTypes = {
  mk: PropTypes.any.isRequired,
  query: PropTypes.string.isRequired,
  match: PropTypes.any.isRequired,
};

export default withMK(withRouter(SearchPage));
