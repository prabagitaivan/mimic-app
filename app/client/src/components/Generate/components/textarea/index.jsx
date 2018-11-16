import React, { PureComponent } from 'react';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
});

class TextArea extends PureComponent {
  render() {
    // eslint-disable-next-line react/prop-types
    const { classes } = this.props;

    return (
      <form className={classes.container} noValidate autoComplete="off">
        <TextField
          id="standard-full-width"
          className={classes.textField}
          rows="3"
          rowsMax="6"
          label="Write some Indonesia words!"
          placeholder="Budi bermain bola"
          multiline
          fullWidth
        />
      </form>
    );
  }
}

export default withStyles(styles)(TextArea);
