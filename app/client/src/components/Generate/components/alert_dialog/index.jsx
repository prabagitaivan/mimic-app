import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

class AlertDialog extends PureComponent {
  render() {
    const open = true;

    return (
      <div>
        <Dialog open={open}>
          <DialogTitle>{ this.props.title }</DialogTitle>
          <DialogContent>
            <DialogContentText>{ this.props.message }</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button color="secondary" component={Link} to="/"> OK </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

AlertDialog.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
};

export default AlertDialog;
