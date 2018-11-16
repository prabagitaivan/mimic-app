import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Typography from '@material-ui/core/Typography';
import AlertDialog from './components/alert_dialog';
import List from './components/list';
import TextArea from './components/textarea';

class Generate extends PureComponent {
  constructor() {
    super();
    this.state = {
      alert: {
        title: '',
        message: '',
      },
      // eslint-disable-next-line react/no-unused-state
      speechdata: [],
    };
  }

  componentDidMount() {
    axios.get('http://localhost/speechdata')
      .then((res) => {
        if (res.data.length === 0) {
          const alert = {
            title: 'Oops',
            message: 'No speech data available. Please try again after you make one.',
          };
          this.setState({ alert });
        }

        // eslint-disable-next-line react/no-unused-state
        this.setState({ speechdata: res.data });
      })
      .catch((err) => {
        const alert = {
          title: 'Oops',
          message: `Something went wrong. Error: ${err.message}`,
        };
        this.setState({ alert });
      });
  }

  render() {
    const { alert } = this.state;

    if (alert.title !== '' && alert.message !== '') {
      return <AlertDialog title={alert.title} message={alert.message} />;
    }

    return (
      <div>
        <Typography variant="h3" gutterBottom> Mimic Speech </Typography>
        <List />
        <TextArea />
        <button type="submit">Generate Speech</button>
        <br />
        <Link to="/"><button type="submit">Finish</button></Link>
      </div>
    );
  }
}

export default Generate;
